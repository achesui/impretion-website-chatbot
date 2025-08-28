import { useEffect, useRef, useState, useCallback } from "react";
import { useStopWatch } from "./use-stop-watch";
import RealtimeKitClient from "@cloudflare/realtimekit";
import { useAgent } from "agents/react";
import type { CallStatus, Messages } from "../components/chatbot/chatbot-types";
import type { ServerConfiguration } from "../types";
import { MicVAD } from "@ricky0123/vad-web";
import { useLocalStorageState } from "./use-sticky-state";

const SPEECH_THRESHOLD = 0.75;

export function useCallHandler({
  connection,
  setMessages,
}: {
  connection: ServerConfiguration["connectionData"];
  setMessages: React.Dispatch<React.SetStateAction<Messages>>;
}) {
  // ✅ Estados persistentes para mantener sesión entre navegaciones
  const [callMode, setCallMode] = useLocalStorageState(false, "callMode");
  const [isSessionAlive, setIsSessionAlive] = useLocalStorageState(
    false,
    "isSessionAlive"
  );
  const [sessionStartTime, setSessionStartTime] = useLocalStorageState(
    null,
    "sessionStartTime"
  );

  // Estados locales para UI
  const [callStatus, setCallStatus] = useState<CallStatus>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { organizationId, userId } = connection;
  const { start, pause, reset, time, setStartTime } = useStopWatch();

  // Referencias persistentes
  const meetingRef = useRef<RealtimeKitClient | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const vadRef = useRef<MicVAD | null>(null);
  const isCleaningUp = useRef(false);
  const hasInitialized = useRef(false);

  // Referencia actualizada de setMessages
  const setMessagesRef = useRef(setMessages);
  setMessagesRef.current = setMessages;

  // ✅ Callback estable para mensajes del agente
  const handleAgentMessage = useCallback((message: any) => {
    try {
      const { type, payload } = JSON.parse(message.data);

      if (type === "event" && payload.messageType === "callDetails") {
        // Manejar eventos de llamada del servidor
        const callEvent = JSON.parse(payload.content);
        console.log("📞 Call event from server:", callEvent);
        return;
      }

      if (type === "message") {
        const { role, content, messageType, timestamp } = payload;

        setMessagesRef.current((prevMessages) => {
          let messageTimestamp;
          try {
            messageTimestamp = timestamp ? new Date(timestamp) : new Date();
            if (isNaN(messageTimestamp.getTime())) {
              messageTimestamp = new Date();
            }
          } catch (error) {
            console.warn("⚠️ Error parseando timestamp:", error);
            messageTimestamp = new Date();
          }

          const newMessage = {
            content: content || "Mensaje ininteligible",
            role,
            timestamp: messageTimestamp,
            messageType,
          };

          // Agregar y ordenar por timestamp
          const allMessages = [...prevMessages, newMessage];
          return allMessages.sort((a, b) => {
            const timeA = a.timestamp.getTime();
            const timeB = b.timestamp.getTime();

            if (timeA === timeB) {
              return a.role === "user" ? -1 : 1;
            }
            return timeA - timeB;
          });
        });
      }
    } catch (error) {
      console.error("❌ Error procesando mensaje del agente:", error);
    }
  }, []);

  // ✅ Agente con configuración para reconexiones
  const realtimeAgent = useAgent({
    agent: "ASSISTANT_WRAPPER",
    name: `${userId}-${organizationId}-organizational`,
    host: "localhost:3007",
    startClosed: true,
    onMessage: handleAgentMessage,
    onOpen() {
      console.log("✅ Agente conectado/reconectado exitosamente");

      if (isSessionAlive && !hasInitialized.current) {
        // Es una reconexión - restaurar estado
        console.log("🔄 Reconexión detectada - Restaurando sesión");
        setCallStatus("connected");

        // Restaurar cronómetro si hay tiempo de inicio guardado
        if (sessionStartTime) {
          const elapsed = Math.floor(
            (Date.now() - new Date(sessionStartTime).getTime()) / 1000
          );
          setStartTime(elapsed);
          start();
        }

        hasInitialized.current = true;
      } else if (!isSessionAlive) {
        // Es una nueva conexión
        console.log("🆕 Nueva sesión iniciada");
        setCallStatus("connected");
        setIsConnecting(false);

        const now = new Date();
        setSessionStartTime(now.toISOString());
        start();

        // Agregar mensaje de sistema
        setMessagesRef.current((prev) => [
          ...prev,
          {
            role: "system",
            content: JSON.stringify({
              callStatus: "connected",
              channels: ["audio"],
              connectedAt: now,
              endedAt: null,
            }),
            messageType: "callDetails",
            timestamp: now,
          },
        ]);

        hasInitialized.current = true;
      }
    },
    onClose(event) {
      console.log(
        "🔌 Cliente desconectado del agente:",
        event.code,
        event.reason
      );

      // Si es código 1001 (navegación) y hay sesión activa, no hacer nada especial
      // El Agent mantendrá la conexión OpenAI
      if (event.code === 1001 && isSessionAlive) {
        console.log("🧭 Navegación detectada - Sesión se mantiene activa");
        return;
      }

      // Si es código 1000 (cierre normal) significa que el usuario colgó
      if (event.code === 1000 && isSessionAlive) {
        console.log("📞 Usuario terminó la llamada");
        handleCallEnd(true);
      }
    },
    onError(error) {
      console.error("❌ Error del agente:", error);
      setCallStatus(null);
      setIsConnecting(false);
    },
  });

  // ✅ Función para terminar llamada completamente
  const handleCallEnd = useCallback(
    (addMessage = true) => {
      console.log("🔚 Terminando sesión de llamada...");

      pause();

      if (addMessage && isSessionAlive) {
        setMessagesRef.current((prev) => [
          ...prev,
          {
            role: "system",
            content: JSON.stringify({
              callStatus: "ended",
              channels: ["audio"],
              connectedAt: sessionStartTime ? new Date(sessionStartTime) : null,
              endedAt: new Date(),
              duration: time,
            }),
            messageType: "callDetails",
            timestamp: new Date(),
          },
        ]);
      }

      // Limpiar estados persistentes
      setCallMode(false);
      setIsSessionAlive(false);
      setSessionStartTime(null);

      // Limpiar estados locales
      setCallStatus(null);
      setIsConnecting(false);
      hasInitialized.current = false;

      reset();
    },
    [
      pause,
      reset,
      time,
      sessionStartTime,
      isSessionAlive,
      setCallMode,
      setIsSessionAlive,
      setSessionStartTime,
    ]
  );

  // ✅ Función de limpieza de recursos del cliente
  const cleanupClientResources = useCallback(async () => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    console.log("🧹 Limpiando recursos del cliente...");

    try {
      // Detener VAD
      if (vadRef.current) {
        vadRef.current.destroy();
        vadRef.current = null;
      }

      // Limpiar elemento audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.srcObject = null;
        audioElementRef.current.remove();
        audioElementRef.current = null;
      }

      // Cerrar data channel
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }

      // Salir de RealtimeKit
      if (meetingRef.current) {
        try {
          await meetingRef.current.leave();
        } catch (error) {
          console.warn("⚠️ Warning durante limpieza RealtimeKit:", error);
        } finally {
          meetingRef.current = null;
        }
      }
    } catch (error) {
      console.error("❌ Error durante limpieza:", error);
    } finally {
      isCleaningUp.current = false;
    }
  }, []);

  // ✅ Función principal para manejar llamadas
  const callHandler = useCallback(async () => {
    // Si ya hay una llamada en curso, terminarla
    if (callMode || isConnecting) {
      try {
        console.log("📞 Usuario terminando llamada...");
        setCallStatus("disconnecting");

        await cleanupClientResources();

        // Cerrar conexión del agente con código 1000 (cierre normal)
        realtimeAgent.close(1000, JSON.stringify({ duration: time }));

        // handleCallEnd se llamará en onClose

        console.log("✅ Llamada terminada exitosamente");
      } catch (error) {
        console.error("❌ Error terminando llamada:", error);
        // Forzar limpieza en caso de error
        handleCallEnd(false);
      }
      return;
    }

    // Iniciar nueva llamada
    if (isConnecting) return;

    setIsConnecting(true);
    setCallStatus("connecting");

    try {
      console.log("📞 Iniciando nueva llamada...");

      // 1. Obtener token para RealtimeKit
      const meetingResponse = await fetch(
        "http://localhost:3002/channels/chatbot/start-call",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!meetingResponse.ok) {
        throw new Error(`Error obteniendo token: ${meetingResponse.status}`);
      }

      const { participant } = await meetingResponse.json();
      const authToken = participant.data.token;

      // 2. Inicializar RealtimeKit
      console.log("🎤 Inicializando RealtimeKit...");
      const rtkInstance = await RealtimeKitClient.init({
        authToken,
        defaults: {
          video: false,
          audio: true,
        },
      });

      await rtkInstance.join();
      meetingRef.current = rtkInstance;

      // 3. Configurar VAD con el audio track
      const audioTrack = meetingRef.current.self.audioTrack;
      if (audioTrack) {
        const mediaStream = new MediaStream([audioTrack]);

        const vad = await MicVAD.new({
          model: "v5",
          stream: mediaStream,
          onFrameProcessed: (probability, frame) => {
            if (probability.isSpeech > SPEECH_THRESHOLD) {
              // Enviar audio al agente cuando sea necesario
              // realtimeAgent.send(frame);
            }
          },
        });

        vadRef.current = vad;
        vad.start();
      }

      // 4. Marcar sesión como activa ANTES de conectar
      setCallMode(true);
      setIsSessionAlive(true);

      // 5. Conectar al agente
      console.log("🤖 Conectando al agente...");
      realtimeAgent.reconnect();

      console.log("✅ Llamada iniciada exitosamente");
    } catch (error) {
      console.error("❌ Error iniciando llamada:", error);

      // Limpieza en caso de error
      await cleanupClientResources();
      setCallMode(false);
      setIsSessionAlive(false);
      setSessionStartTime(null);
      setCallStatus(null);
      setIsConnecting(false);
      reset();

      // Mostrar mensaje de error
      setMessagesRef.current((prev) => [
        ...prev,
        {
          content:
            "Lo siento, no he podido iniciar la llamada. Por favor, intenta de nuevo.",
          role: "assistant",
          timestamp: new Date(),
          messageType: "commonMessage",
        },
      ]);
    }
  }, [
    callMode,
    isConnecting,
    time,
    reset,
    start,
    cleanupClientResources,
    realtimeAgent,
    handleCallEnd,
    setCallMode,
    setIsSessionAlive,
    setSessionStartTime,
    setStartTime,
  ]);

  // ✅ Reconexión automática al cargar/navegar si hay sesión activa
  useEffect(() => {
    if (
      isSessionAlive &&
      !hasInitialized.current &&
      realtimeAgent.readyState !== 1
    ) {
      console.log(
        "🔄 Detectada sesión activa - Iniciando reconexión automática..."
      );

      // Pequeño delay para asegurar que todo esté listo
      const timer = setTimeout(() => {
        if (isSessionAlive && !hasInitialized.current) {
          setCallStatus("connecting");
          realtimeAgent.reconnect();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isSessionAlive, realtimeAgent]);

  // ✅ Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      console.log("🔄 Desmontando useCallHandler...");
      cleanupClientResources();
    };
  }, [cleanupClientResources]);

  return {
    callHandler,
    time,
    callStatus,
    callMode,
    isSessionAlive,
    callReconnect: () => {
      if (isSessionAlive && realtimeAgent.readyState !== 1) {
        console.log("🔄 Reconexión manual solicitada...");
        realtimeAgent.reconnect();
      }
    },
  };
}

/*
      // 1. Obtener token para RealtimeKit
      const meetingResponse = await fetch(
        "http://localhost:3002/channels/chatbot/start-call",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!meetingResponse.ok) {
        throw new Error(`Token error: ${meetingResponse.status}`);
      }

      const { participant } = await meetingResponse.json();
      const authToken = participant.data.token;

      // 2. Inicializar RealtimeKit
      const rtkInstance = await RealtimeKitClient.init({
        authToken,
        defaults: {
          video: false,
          audio: true,
        },
      });

      await rtkInstance.join();
      meetingRef.current = rtkInstance;

      // 4. Obtener audio track optimizado
      const cleanAudioTrack = rtkInstance.self.audioTrack;
      if (!cleanAudioTrack) {
        throw new Error("No audio track available from RealtimeKit");
      }

      const cleanAudioStream = new MediaStream([cleanAudioTrack]);

      // 5. Crear PeerConnection
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // Event handler ANTES de cualquier operación
      peerConnection.addEventListener("track", (event: RTCTrackEvent) => {
        console.log("🎵 Track received");
        const remoteStream = event.streams[0];

        if (remoteStream && remoteStream.getAudioTracks().length > 0) {
          let audioElement = audioElementRef.current;

          if (!audioElement) {
            audioElement = document.createElement("audio");
            audioElement.autoplay = true;
            audioElement.volume = 1.0;

            const container =
              document.getElementById("audio-container") || document.body;
            container.appendChild(audioElement);
            audioElementRef.current = audioElement;
          }

          audioElement.srcObject = remoteStream;
          audioElement.play().catch((error) => {
            console.error("❌ Audio playback error:", error);
          });
        }
      });

      // 6. Crear data channel ANTES de add tracks
      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("open", () => {
        console.log("📡 DataChannel opened");

        // Session config optimizada
        dataChannel.send(
          JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["audio", "text"],
              voice: "alloy",
              input_audio_transcription: { model: "whisper-1" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 200,
              },
              temperature: 0.8,
            },
          })
        );

        // Respuesta inicial
        const initialResponse = {
          type: "response.create",
          response: {
            modalities: ["audio"],
            instructions: "Saluda brevemente y pregunta cómo puedes ayudar.",
          },
        };

        dataChannel.send(JSON.stringify(initialResponse));
      });

      // Event handlers del data channel
      let userMessageTimestamp: Date | null;
      dataChannel.addEventListener("message", (event) => {
        const parsedEvent = JSON.parse(event.data);
        const { type } = parsedEvent;

        if (type === "input_audio_buffer.speech_started") {
          // Obtención del timestamp actual cuando el usuario comienza a hablar.
          userMessageTimestamp = new Date();
        }

        if (type === "response.done") {
          const { response } = parsedEvent;
          const assistantResponse = response.output[0].content[0].transcript;

          console.log("🤖 Respuesta completa:", assistantResponse);
          realtimeAgent.send(
            JSON.stringify({
              type: "message",
              payload: {
                content: assistantResponse,
                role: "assistant" as const,
                timestamp: new Date(),
                messageType: "commonMessage",
              },
            })
          );
        }

        if (type === "conversation.item.input_audio_transcription.completed") {
          const { transcript } = parsedEvent;
          console.log("🎤 Transcripción completa:", transcript);

          console.log("timestamp transcripcion => ", userMessageTimestamp);
          // Envio del mensaje de usuario con el timestamp guardado.
          realtimeAgent.send(
            JSON.stringify({
              type: "message",
              payload: {
                content: transcript,
                role: "user" as const,
                timestamp: userMessageTimestamp,
                messageType: "commonMessage",
              },
            })
          );

          userMessageTimestamp = null;
        }

        if (type === "output_audio_buffer.stopped") {
        }
      
      });

      // 7. Procesar todos los tracks
      const tracks = cleanAudioStream.getTracks();
      tracks.forEach((track) => {
        peerConnection.addTransceiver(track, { direction: "sendrecv" });
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // 8. Obtener token OpenAI
      const tokenResponse = await fetch(
        "http://localhost:3002/channels/chatbot/oai-realtime-token"
      );

      if (!tokenResponse.ok) {
        throw new Error("Internal token error");
      }

      const tokenData = await tokenResponse.json();
      const EPHEMERAL_KEY = tokenData.result.client_secret.value;

      // 9. Conectar a OpenAI
      const oaiRealtimeConnection = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      if (!oaiRealtimeConnection.ok) {
        throw new Error("OpenAI connection failed");
      }

      const answer = await oaiRealtimeConnection.text();
      await peerConnection.setRemoteDescription({
        sdp: answer,
        type: "answer",
      });

      start();
      console.log("✅ Call established successfully");
       */
