/**
 * Glossary terms for the Learn glossary page.
 * General engineering, infrastructure, and security terms.
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

export const glossaryTerms: GlossaryTerm[] = [
  { term: "API", definition: "Application Programming Interface. A set of protocols and tools that allows different software applications to communicate with each other.", category: "Engineering" },
  { term: "Authentication", definition: "The process of verifying the identity of a user, device, or system before granting access to resources.", category: "Security" },
  { term: "Authorization", definition: "The process of determining what permissions an authenticated user has and what resources they can access.", category: "Security" },
  { term: "Bandwidth", definition: "The maximum rate of data transfer across a given path, typically measured in bits per second.", category: "Infrastructure" },
  { term: "Cache", definition: "A hardware or software component that stores data so future requests for that data can be served faster.", category: "Infrastructure" },
  { term: "CI/CD", definition: "Continuous Integration and Continuous Deployment. A method to frequently deliver apps by introducing automation into the stages of development.", category: "Engineering" },
  { term: "CLI", definition: "Command Line Interface. A text-based user interface used to interact with software and operating systems by typing commands.", category: "Engineering" },
  { term: "Cloud Computing", definition: "The delivery of computing services over the internet, including servers, storage, databases, networking, and software.", category: "Infrastructure" },
  { term: "Component", definition: "A reusable, self-contained piece of code that defines how a section of the user interface should appear and behave.", category: "Engineering" },
  { term: "CORS", definition: "Cross-Origin Resource Sharing. A mechanism that allows restricted resources on a web page to be accessed from another domain.", category: "Security" },
  { term: "Database", definition: "An organized collection of structured data stored electronically, designed for efficient retrieval and manipulation.", category: "Infrastructure" },
  { term: "Deployment", definition: "The process of making a software application available for use, typically by moving it to a production server.", category: "Engineering" },
  { term: "DNS", definition: "Domain Name System. The hierarchical naming system that translates human-readable domain names into IP addresses.", category: "Infrastructure" },
  { term: "Edge Computing", definition: "A distributed computing paradigm that brings computation and data storage closer to the sources of data to reduce latency.", category: "Infrastructure" },
  { term: "Encryption", definition: "The process of converting information into a code to prevent unauthorized access, ensuring data confidentiality.", category: "Security" },
  { term: "Endpoint", definition: "A specific URL where an API can be accessed by a client application to perform operations on server resources.", category: "Engineering" },
  { term: "Environment Variable", definition: "A dynamic value that can affect the behavior of running processes on a computer, often used for configuration.", category: "Engineering" },
  { term: "Firewall", definition: "A network security system that monitors and controls incoming and outgoing network traffic based on security rules.", category: "Security" },
  { term: "Framework", definition: "A platform for developing software applications that provides a foundation with pre-built components and conventions.", category: "Engineering" },
  { term: "Git", definition: "A distributed version control system that tracks changes in source code during software development.", category: "Engineering" },
  { term: "GraphQL", definition: "A query language for APIs that allows clients to request exactly the data they need, reducing over-fetching.", category: "Engineering" },
  { term: "HTTP", definition: "Hypertext Transfer Protocol. The foundation of data communication on the World Wide Web, defining how messages are formatted and transmitted.", category: "Infrastructure" },
  { term: "Hydration", definition: "The process of attaching event listeners and making server-rendered HTML interactive on the client side.", category: "Engineering" },
  { term: "IDE", definition: "Integrated Development Environment. A software application that provides comprehensive facilities for software development.", category: "Engineering" },
  { term: "Immutable", definition: "A property of data that cannot be changed after it is created, promoting predictability and reducing side effects.", category: "Engineering" },
  { term: "JWT", definition: "JSON Web Token. A compact, URL-safe means of representing claims to be transferred between two parties for authentication.", category: "Security" },
  { term: "Kubernetes", definition: "An open-source container orchestration platform that automates deployment, scaling, and management of containerized applications.", category: "Infrastructure" },
  { term: "Latency", definition: "The time delay between a user action and the system response, often measured in milliseconds.", category: "Infrastructure" },
  { term: "Load Balancer", definition: "A device or software that distributes network traffic across multiple servers to ensure no single server is overwhelmed.", category: "Infrastructure" },
  { term: "Middleware", definition: "Software that acts as a bridge between an operating system or database and applications, especially in a network.", category: "Engineering" },
  { term: "Microservices", definition: "An architectural style where an application is composed of small, independent services that communicate over APIs.", category: "Engineering" },
  { term: "Migration", definition: "The process of moving data, applications, or other business elements from one environment to another.", category: "Engineering" },
  { term: "OAuth", definition: "An open standard for access delegation commonly used to grant websites or applications access to user information without exposing passwords.", category: "Security" },
  { term: "ORM", definition: "Object-Relational Mapping. A technique that lets you interact with your database using an object-oriented paradigm.", category: "Engineering" },
  { term: "Payload", definition: "The actual data transmitted in a network request or message, excluding headers and metadata.", category: "Engineering" },
  { term: "Query", definition: "A request for data or information from a database, typically written in a structured query language.", category: "Engineering" },
  { term: "Rate Limiting", definition: "A strategy for controlling the number of requests a user can make to an API within a given time period.", category: "Security" },
  { term: "REST", definition: "Representational State Transfer. An architectural style for designing networked applications using stateless HTTP requests.", category: "Engineering" },
  { term: "Runtime", definition: "The period during which a program is executing, or the environment in which a program runs.", category: "Engineering" },
  { term: "SDK", definition: "Software Development Kit. A collection of tools, libraries, and documentation that helps developers build applications for a specific platform.", category: "Engineering" },
  { term: "Serverless", definition: "A cloud computing execution model where the cloud provider dynamically manages the allocation of machine resources.", category: "Infrastructure" },
  { term: "SSR", definition: "Server-Side Rendering. The process of rendering web pages on the server before sending them to the client browser.", category: "Engineering" },
  { term: "SSL/TLS", definition: "Secure Sockets Layer / Transport Layer Security. Cryptographic protocols designed to provide secure communications over a network.", category: "Security" },
  { term: "State Management", definition: "The practice of managing and synchronizing the state of an application across different components and views.", category: "Engineering" },
  { term: "Token", definition: "A piece of data that represents authorization or identity, used to authenticate requests between systems.", category: "Security" },
  { term: "TypeScript", definition: "A strongly typed programming language that builds on JavaScript by adding static type definitions for improved developer experience.", category: "Engineering" },
  { term: "Uptime", definition: "The amount of time a system or service is operational and available, often expressed as a percentage.", category: "Infrastructure" },
  { term: "Versioning", definition: "The process of assigning unique version numbers to different states of a software product to track changes over time.", category: "Engineering" },
  { term: "Webhook", definition: "An HTTP callback that delivers real-time data to other applications when a specific event occurs.", category: "Engineering" },
  { term: "WebSocket", definition: "A communication protocol that provides full-duplex communication channels over a single TCP connection.", category: "Infrastructure" },
  { term: "YAML", definition: "A human-readable data serialization language commonly used for configuration files and data exchange between languages.", category: "Engineering" },
];

export const categories = Array.from(new Set(glossaryTerms.map((t) => t.category))).sort();
