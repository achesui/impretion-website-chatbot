import { ExternalLinkIcon } from "../../../../icons";
import type { Messages } from "../../chatbot-types";

export function ProductMessage({ message }: { message: Messages[number] }) {
  const content = JSON.parse(message.content);

  // Obtención de productos
  const { returnedProducts, message: assistantMessage } = content;

  const handleManualNavigation = (url: string) => {
    window.location.href = url;
  };

  return (
    <>
      <div className={`cb-bubble assistant`}>
        <p>{assistantMessage.content}</p>
        <span className={"cb-timestamp assistant"}>
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <div className={`cb-products-list`}>
        <div className={`cb-main-product`}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <img
              className={`cb-main-product-image`}
              src={
                returnedProducts.mainProduct.image ||
                "https://placehold.co/600x400"
              }
            ></img>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p>{returnedProducts.mainProduct.title}</p>
              <p className={`cb-product-price`}>
                {returnedProducts.mainProduct.price}
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              cursor: "pointer",
              gap: "4px",
              alignItems: "center",
            }}
            onClick={() =>
              handleManualNavigation(returnedProducts.mainProduct.url)
            }
          >
            <ExternalLinkIcon size={16} />
          </div>
        </div>
        <div class="separator">recomendados</div>
        {returnedProducts.recommendations.map((product: any) => (
          <button
            className={`cb-recommended-products`}
            onClick={() => handleManualNavigation(product.url)}
            key={product.url}
          >
            <div>
              <p>{product.title}</p>
              <p className={`cb-product-price`}>{product.price}</p>
            </div>
            <div
              style={{
                display: "flex",
                cursor: "pointer",
                gap: "4px",
                alignItems: "center",
              }}
            >
              <ExternalLinkIcon size={16} />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
