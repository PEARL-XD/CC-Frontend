export const policyUpdatedAt = "17 October 2026";
export const policyBusiness = {
  name: "CleanChops",
  operator: "PEARL",
  address: "Flat 1408, Tower G1, Bharat City Phase II, Indraprastha Yojana, Shahpur Nij Morta, Ghaziabad Tahsil, Ghaziabad, Uttar Pradesh - 201102, India",
};
export const policyContact = {
  email: "supportcleanchops@gmail.com",
  phone: "+91 7678673823",
  phoneHref: "tel:+917678673823",
  whatsappHref: "https://wa.me/917678673823",
};

export const policySections = [
  {
    id: "about", label: "About Us", title: "About CleanChops",
    content: [
      { heading: "Business identity and address", body: `${policyBusiness.name} is operated by ${policyBusiness.operator}. Business address: ${policyBusiness.address}.` },
      { heading: "Our service", body: "CleanChops is a fresh meat delivery service. Customers can browse the available products, select cuts and quantities, and place orders through the CleanChops website or Android and iOS applications." },
      { heading: "Products and availability", body: "Our catalogue includes fresh chicken cuts and other products listed in the app or website. The available range, portion sizes, prices and delivery coverage are shown before an order is placed. Availability may vary by location and time." },
      { heading: "Our website and apps", body: "These policies apply to orders placed through CleanChops, including our Android app (com.cleanchops.app), iOS app (com.pearl.cleanchops) and website at cleanchops.in. You can read all policies and contact us without creating an account or signing in." },
    ],
  },
  {
    id: "delivery", label: "Shipping & Delivery", title: "Shipping and Delivery Policy",
    content: [
      { heading: "Serviceable locations", body: "Delivery is available within our designated serviceable zones. Select your delivery address in the app or website to check availability. A saved address does not guarantee that delivery is currently available; the serviceability result and delivery options shown at checkout apply." },
      { heading: "Delivery time", body: "Our delivery window is 60-90 minutes from order confirmation. Scheduled orders follow the slot selected at checkout. Contact our support team if an order is delayed or if you need help with your delivery." },
      { heading: "Delivery charges and order total", body: "Product prices are displayed in Indian Rupees (INR). Applicable delivery charges, discounts and the final payable amount are displayed at checkout before payment or order confirmation." },
      { heading: "Tracking and delivery information", body: "Order status is available in My Orders. Please provide a reachable mobile number, the correct delivery pin and your complete address, including house or flat number, building and floor where relevant. Delivery staff may use these details to contact you and locate your address." },
      { heading: "Failed delivery or an unavailable item", body: "If delivery cannot be completed, our team will try to contact you using your order details. Contact support promptly to resolve an incorrect address, an unavailable item or a delivery problem. If we cancel a prepaid order because we cannot fulfil it, the amount collected for the cancelled order will be refunded through the original payment provider." },
    ],
  },
  {
    id: "privacy", label: "Privacy Policy", title: "Privacy Policy",
    content: [
      { heading: "Who this policy applies to", body: `This policy describes how ${policyBusiness.name}, operated by ${policyBusiness.operator}, handles personal information through our website and apps. Our business address is ${policyBusiness.address}. For privacy questions, email ${policyContact.email}.` },
      { heading: "Information we collect", body: "We collect the details you provide to use CleanChops: your name, email address, mobile number, saved addresses, address labels, delivery instructions, order history and support messages. If you choose Google or Apple sign-in, we receive the account information made available by that provider, such as your account identifier, name and email. Technical information needed to operate and secure the service may include device information, notification tokens and error logs." },
      { heading: "Location information and permission", body: "When you choose to use your current location, we request your device or browser's location permission. A location you confirm on the map, including its coordinates and address, can be saved to your account and attached to an order to check delivery coverage and help fulfil delivery. You can decline device location permission and select a delivery point manually on the map where available. Device permission can be changed in your browser or phone settings." },
      { heading: "How we use your information", body: "We use account, contact and address details to manage your account, process payments and orders, check serviceability, arrange delivery, send order updates, provide support, prevent misuse and maintain our services. A saved delivery location is linked to your account. We do not sell your personal information." },
      {
        heading: "Payments through Cashfree and Razorpay",
        body: "Online payments are processed by our payment gateway partners, Cashfree or Razorpay. We share the order amount, order reference and necessary customer contact details to process and reconcile the payment. CleanChops stores order and transaction references and payment or refund status, not your full card number, CVV, UPI PIN or banking passwords. Sensitive payment credentials are handled by the payment provider, bank or UPI application.",
        links: [
          { label: "Cashfree privacy policy", href: "https://www.cashfree.com/privacypolicy/" },
          { label: "Razorpay privacy policy", href: "https://razorpay.com/privacy/" },
        ],
      },
      { heading: "Service providers and data sharing", body: "We share the information needed to deliver your order with authorised fulfilment or delivery personnel. We also use service providers for maps and location selection, sign-in, payment processing, hosting and notifications. They receive information needed for those services under their applicable policies. Information may also be disclosed where required by law or to investigate fraud and protect customers." },
      { heading: "Cookies, local storage and notification choices", body: "Our website uses cookies and browser storage for sign-in, session continuity and checkout recovery. Blocking or clearing this storage may sign you out or affect checkout. Notification permissions can be changed in your device or browser settings; available notification preferences can also be managed within the app." },
      { heading: "Retention, correction and deletion", body: "You can update your profile and saved addresses in the app or website. You may request access, correction or deletion by emailing supportcleanchops@gmail.com. Account deletion is also available in the app's Profile section. We may retain order, payment and related records where needed for legal obligations, accounting, refunds, disputes or fraud prevention, even after account deletion. We verify requests before changing or disclosing account information." },
      { heading: "Privacy enquiries and policy updates", body: "For privacy questions or concerns, contact supportcleanchops@gmail.com or call +91 7678673823. We may update this policy as our services change; the last-updated date appears on this page." },
    ],
  },
  {
    id: "terms", label: "Terms & Conditions", title: "Terms and Conditions",
    content: [
      { heading: "Using CleanChops", body: `CleanChops is operated by ${policyBusiness.operator}. By using the CleanChops website or apps and placing an order, you agree to these terms and the delivery, cancellation, refund and privacy policies on this page. You must be at least 18 years old and capable of entering into a legally binding agreement to place an order.` },
      { heading: "Account and delivery details", body: "Provide accurate account, mobile number and delivery information, keep your sign-in credentials secure, and contact support if you suspect unauthorised account use. Order acceptance depends on product availability and applicable delivery coverage." },
      { heading: "Prices and payment", body: "Prices and final totals are shown in INR at checkout. Online payments are handled by Cashfree or Razorpay; cash on delivery is available only when displayed at checkout. For prepaid orders, payment must be verified before the order is treated as paid. An amount debited by a bank does not by itself confirm an order: check My Orders or contact support before paying again." },
      { heading: "Order changes and cancellations", body: "Use the cancellation option shown in My Orders while your order is eligible. Once an order is packed, out for delivery or delivered, self-service cancellation is unavailable. Contact support promptly for other changes or concerns. Refund and quality-complaint details are set out in the Cancellation, Returns and Refund Policy below." },
      { heading: "Availability and fulfilment", body: "If we cannot fulfil an order because of stock unavailability, a delivery issue or an incorrect price, we may contact you or cancel it. Any payment collected for an order we cancel will be refunded. Report an incorrect item or a quality concern promptly with the order reference and relevant photos." },
      { heading: "Responsible use and statutory rights", body: "Do not submit fraudulent orders, manipulate prices or payment records, misuse another person's account, or interfere with the service. These policies do not exclude any rights or remedies available to you under applicable law. Contact our support team about an order or service complaint." },
    ],
  },
  {
    id: "refunds", label: "Cancellation & Refunds", title: "Cancellation, Returns and Refund Policy",
    content: [
      { heading: "How to cancel an order", body: "Open My Orders and use Cancel while the option is available. Self-service cancellation is not available after an order is packed, out for delivery or delivered. If the option is unavailable or you need help, contact support with your order reference. A confirmed cancellation appears in My Orders." },
      { heading: "Incorrect items, quality issues and returns", body: "Contact us within 2 hours of delivery to report an incorrect item, damage or a quality concern, and share the order reference and relevant photos. Do not consume a product if you suspect a quality or safety issue. Because these are perishable products, contact support before arranging any physical return. Our team will review the issue for an appropriate replacement or refund. This reporting guidance does not limit your statutory rights." },
      { heading: "Eligible refunds and refund destination", body: "For an eligible cancelled prepaid order, the amount collected for that cancellation is refunded through the payment provider used for the original payment, to the original payment source. Approved quality or incorrect-item claims are resolved according to the affected items. An unpaid cash-on-delivery order has no prepaid amount to refund; contact support for a claim relating to an already delivered and paid COD order." },
      { heading: "Refund processing and tracking", body: "For eligible prepaid cancellations, refund processing is normally initiated within 24-48 hours. The time for the credit to appear depends on the payment provider and your bank; initiation is not the same as bank credit. View the available payment and refund status in My Orders, or contact support with your order and transaction reference if a refund is delayed." },
      { heading: "Debited payments without order confirmation", body: "If money was debited but the app has not confirmed payment, check the existing order's payment status before retrying. Contact us with the order and transaction reference. We verify the transaction with the payment provider; a completed payment received for a cancelled order is handled for refund rather than reopening the cancelled order." },
    ],
  },
  {
    id: "contact", label: "Contact Us", title: "Contact Us and Customer Support",
    content: [
      { heading: "Business name and address", body: `${policyBusiness.name}, operated by ${policyBusiness.operator}. Business address: ${policyBusiness.address}.` },
      {
        heading: "Order, delivery, payment and policy enquiries",
        body: "Contact the CleanChops support team by email, telephone or WhatsApp. You do not need to log in to use these contact options. Include your order reference when asking about an order, payment or refund.",
        links: [
          { label: "supportcleanchops@gmail.com", href: "mailto:supportcleanchops@gmail.com" },
          { label: "Call +91 7678673823", href: policyContact.phoneHref },
          { label: "WhatsApp CleanChops", href: policyContact.whatsappHref },
        ],
      },
      { heading: "Privacy requests and unresolved concerns", body: "For account data requests or an unresolved complaint, email supportcleanchops@gmail.com with the subject Privacy Request or Order Complaint, as applicable. Describe the concern and include any previous support reference so our team can review it." },
      { heading: "Keep your payment information safe", body: "Never send your password, OTP, full card details, CVV or UPI PIN to support or anyone claiming to represent CleanChops. Support can investigate a payment using an order or transaction reference without asking for these credentials." },
    ],
  },
];
