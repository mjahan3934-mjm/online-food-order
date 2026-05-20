# Online Food Order

A full-featured online food ordering website built with Python Flask, JavaScript, HTML, CSS, and SQLite database.

## Features

- Browse menu by categories (Burgers, Pizzas, Drinks, Desserts)
- Add items to cart with quantity controls
- Checkout with customer details
- Order tracking
- Responsive design for mobile and desktop

## Tech Stack

- **Backend:** Python Flask
- **Database:** SQLite with SQLAlchemy ORM
- **Frontend:** HTML5, CSS3, JavaScript
- **Styling:** Custom CSS (no frameworks)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd online-food-order

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Open `http://localhost:5000` in your browser.

## Project Structure

```
online-food-order/
├── app.py              # Flask application & database models
├── requirements.txt    # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css  # Stylesheet
│   ├── js/
│   │   └── main.js    # JavaScript functionality
│   └── images/        # Menu item images
├── templates/
│   ├── base.html      # Base template
│   ├── index.html    # Home page
│   ├── menu.html     # Menu page
│   ├── cart.html     # Shopping cart
│   └── orders.html   # Order tracking
└── food_order.db     # SQLite database
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Home page |
| `/menu` | GET | Menu page |
| `/cart` | GET | Cart page |
| `/orders` | GET | Order tracking |
| `/api/menu` | GET | Get all menu items |
| `/api/orders` | GET | Get all orders |
| `/api/orders` | POST | Create new order |
| `/api/orders/<id>` | GET | Get order details |

## Database Models

- **Category** - Food categories (Burgers, Pizzas, etc.)
- **MenuItem** - Individual menu items
- **Order** - Customer orders
- **OrderItem** - Items within an order

## Live Demo

https://mafia-jahan.github.io/SmartSpend---Expense-Tracker/

## License

MIT License
