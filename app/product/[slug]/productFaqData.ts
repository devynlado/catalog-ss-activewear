export interface FaqItem {
  q: string;
  a: string;
}

export function getProductFaqItems(name: string): FaqItem[] {
  return [
    {
      q: `Is there a minimum order quantity for ${name}?`,
      a: `No, there is no minimum order quantity for ${name}. You can order as little as one piece or place a large bulk order depending on your needs. Whether you\u2019re purchasing a single item or ordering for a group, business, or event, we make the process simple and flexible.`,
    },
    {
      q: `Can I order ${name} with custom screen printing or embroidery?`,
      a: `Yes. ${name} can be customized with screen printing or embroidery depending on your design and order requirements. Our team can help determine the best decoration method to ensure your design looks great on the garment.\n\nPlease note, customization services start at 50 items per design.`,
    },
    {
      q: `Can I mix different sizes in one order?`,
      a: `Absolutely. You can include multiple sizes in the same order by entering the quantity for each size for your selected color. This makes it easy to order for teams, organizations, or group events where different sizes are needed.`,
    },
    {
      q: `Can I order ${name} without customization?`,
      a: `Yes. All of our products are available as blank apparel, so you can purchase them without screen printing or embroidery. This option is perfect if you simply need high-quality blank garments or plan to customize them yourself.`,
    },
    {
      q: `How do I choose the right size?`,
      a: `We recommend reviewing the size chart available in the Specifications section of this product page. The chart provides detailed measurements to help you choose the best fit for your needs. If you\u2019re ordering for a group or organization, checking the size chart in advance can help ensure everyone receives the correct size.`,
    },
    {
      q: `Do you ship nationwide?`,
      a: `Yes. We ship orders throughout the United States using reliable shipping carriers to ensure your order arrives safely and on time. Shipping options and delivery estimates will be provided during checkout.`,
    },
    {
      q: `What happens if there is an issue with my order?`,
      a: `If you experience any issue with your order, please contact our support team and we will work with you to resolve it as quickly as possible. Customer satisfaction is important to us, and we\u2019re here to help if any problems arise.`,
    },
    {
      q: `Can I track my order after it has been shipped?`,
      a: `Yes. Once your order has been processed and shipped, you will receive a tracking number via email. You can use this tracking number to monitor the delivery status of your shipment.`,
    },
  ];
}
