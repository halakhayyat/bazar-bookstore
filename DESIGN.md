# Bazar Bookstore — System Design Document

## 1. Introduction

Bazar Bookstore is a distributed bookstore application developed for Distributed Systems Lab 1. The system is implemented using three independent microservices communicating through HTTP REST APIs.

The application allows clients to search for books, retrieve book information, and purchase books while maintaining inventory and recording successful orders.

## 2. System Architecture

The system consists of three services:

**Frontend Service (Port 5000)**

Acts as the entry point for clients. It receives search, information, and purchase requests and forwards them to the appropriate backend service.

**Catalog Service (Port 5001)**

Maintains book information, including titles, topics, prices, and quantities. It supports searching, retrieving book details, and updating inventory.

**Order Service (Port 5002)**

Processes purchase requests. It communicates with Catalog to retrieve book information and atomically decrease inventory. Successful purchases are recorded in a SQLite database.

### Communication Flow

Search and information requests:

Client → Frontend → Catalog → Frontend → Client

Purchase requests:

Client → Frontend → Order → Catalog → Order → Frontend → Client

## 3. Technologies

- Node.js and Express.js for implementing REST APIs.
- Axios for HTTP communication between services.
- SQLite for persistent data storage.
- Docker for containerizing each service.
- Docker Compose for deploying and connecting the services.

## 4. Database Design

### Catalog Database

The `books` table stores:

| Field | Description |
|---|---|
| id | Unique book identifier |
| title | Book title |
| topic | Book category |
| price | Book price |
| quantity | Available stock |

The database is initialized with four books. Existing records are preserved across restarts.

### Order Database

The `orders` table stores:

| Field | Description |
|---|---|
| order_id | Unique order identifier |
| item_id | Purchased book identifier |
| title | Purchased book title |
| time | Purchase timestamp |

Both databases are stored in persistent Docker volumes.

## 5. API Design

| Service | Method | Endpoint | Purpose |
|---|---|---|---|
| Frontend | GET | /search/:topic | Search books |
| Frontend | GET | /info/:id | Retrieve book information |
| Frontend | POST | /purchase/:id | Purchase a book |
| Catalog | GET | /search/:topic | Search catalog |
| Catalog | GET | /info/:id | Retrieve book details |
| Catalog | GET | /query/:id | Retrieve full catalog record |
| Catalog | PUT | /update/:id | Update price or inventory |
| Order | POST | /purchase/:id | Process purchase |

## 6. Inventory Consistency

The Catalog Service uses an atomic SQL UPDATE operation to decrease stock. The update rejects requests that would make the quantity negative.

The Order Service requests a stock decrement of one item before recording a successful order.

This prevents concurrent inventory updates from overselling stock through the decrement operation.

A limitation of the current implementation is that if order recording fails after the stock decrement succeeds, the inventory change is not automatically rolled back.

## 7. Deployment

Each microservice runs in a separate Linux-based Docker container.

Docker Compose creates a shared network so that the services communicate using their service names:

- `http://catalog:5001`
- `http://order:5002`
- `http://frontend:5000`

Catalog and Order databases use named volumes to preserve data across container restarts.

## 8. Testing

The following tests were completed:

1. Searching for books by topic.
2. Retrieving book information.
3. Purchasing a book through the Frontend Service.
4. Verifying that stock decreases after a successful purchase.
5. Rejecting purchases of nonexistent books.
6. Rejecting inventory updates that would create negative stock.
7. Verifying that Catalog inventory persists after restarting Docker containers.
8. Building and running the three services using Docker Compose.

## 9. Limitations and Future Improvements

The current implementation does not implement distributed transactions between Catalog and Order. A future version could introduce a compensation mechanism if order logging fails after inventory is updated.

Additional improvements could include automated integration tests, service health checks, and better handling of temporary service failures.

## 10. Conclusion

Bazar Bookstore demonstrates a distributed application built from three independent services. The system supports searching, retrieving book information, purchasing books, updating inventory, and persistent database storage using Docker Compose.