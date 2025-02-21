# SmartPark Backend

## Project Introduction

SmartPark is an intelligent parking management system. This project is the backend part of SmartPark, responsible for handling business logic and data management.

## Features

- User registration and login
- Parking lot information management
- Parking space reservation and cancellation
- Real-time parking space status updates
- Payment processing
- Interaction with OpenAI to get real-time latest parking routes
- Real-time sharing of parking space information and vehicle dynamics for multiple users using WebSocket and MySQL

## Tech Stack

- Programming Language: Python
- Framework: Flask
- Database: MySQL
- API: RESTful API

## Installation and Running

### Environment Requirements

- Python 3.12+
- MySQL 8.0+

### Installation Steps

1. Clone the project code:
   ```bash
   git clone https://github.com/yourusername/SmartPark.git
   ```
2. Enter the project directory:
   ```bash
   cd SmartPark/BackEnd
   ```
3. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure the database:
   ```bash
   cp .env.example .env
   # Edit the .env file to configure database connection information
   ```
6. Run database migrations:
   ```bash
   flask db upgrade
   ```
7. Start the development server:
   ```bash
   flask run
   ```

## API Documentation

API documentation can be viewed at:

```
http://localhost:5000/api/docs/
```

## Contribution

Contributions are welcome! Please read the [Contribution Guide](CONTRIBUTING.md) first.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
