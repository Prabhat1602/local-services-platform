---
title: ER Diagram (Database Schema)
---

# Entity-Relationship (ER) Diagram

This diagram visually represents the structure of our MongoDB database, illustrating the main entities (collections/models) and the relationships between them. It serves as a blueprint for the data storage and how different pieces of information connect.

![ER Diagram](https://i.imgur.com/Qk9bYJc.png) 
*This diagram shows how User, Service, Booking, Review, Chat, Message, Notification, and Feedback entities are related.*

## Key Entities and Their Relationships:

* **User:** Central entity for all platform participants (users, providers, admins).
    * One `User` (provider) can create many `Services`.
    * One `User` can make many `Bookings`.
    * One `User` can write many `Reviews`.
    * One `User` can participate in many `Chats` (conversations).
    * One `User` can send many `Messages`.
    * One `User` can receive many `Notifications`.
* **Service:** Represents a service offered by a provider.
    * One `Service` can have many `Bookings`.
    * One `Service` can receive many `Reviews`.
* **Booking:** Represents a confirmed service booking.
    * Connects a `User`, a `Provider` (which is also a `User`), and a `Service`.
* **Review:** Feedback given by a user for a specific service.
* **Chat (Conversation):** Facilitates communication between participants.
    * One `Chat` can contain many `Messages`.
* **Message:** Individual message within a chat conversation.
* **Notification:** Alerts sent to users for important events.
* **Feedback:** User-submitted feedback or support requests.

This clear mapping helps in understanding data flow and ensuring data integrity across the application.