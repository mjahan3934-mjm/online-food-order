import os
from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///food_order.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))
    items = db.relationship('MenuItem', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'items': [item.to_dict() for item in self.items]
        }


class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    price = db.Column(db.Float, nullable=False)
    image = db.Column(db.String(200))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    available = db.Column(db.Boolean, default=True)
    order_items = db.relationship('OrderItem', backref='menu_item', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image': self.image,
            'category_id': self.category_id,
            'available': self.available
        }


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    customer_address = db.Column(db.String(500), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('OrderItem', backref='order', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'customer_address': self.customer_address,
            'total_amount': self.total_amount,
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M'),
            'items': [item.to_dict() for item in self.items]
        }


class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'menu_item_id': self.menu_item_id,
            'menu_item_name': self.menu_item.name,
            'quantity': self.quantity,
            'price': self.price
        }


def init_db():
    with app.app_context():
        db.create_all()
        
        if Category.query.count() == 0:
            categories = [
                Category(name='Burgers', description='Delicious handmade burgers'),
                Category(name='Pizzas', description='Italian wood-fired pizzas'),
                Category(name='Drinks', description='Refreshing beverages'),
                Category(name='Desserts', description='Sweet treats')
            ]
            db.session.add_all(categories)
            db.session.commit()
            
            menu_items = [
                MenuItem(name='Classic Burger', description='Juicy beef patty topped with fresh lettuce, tomato, and onion', price=320, image='images/Classic Burger.jpg', category_id=1),
                MenuItem(name='Cheese Burger', description='Beef patty with melted cheese, lettuce, and tomato', price=350, image='images/Cheese Burger.jpg', category_id=1),
                MenuItem(name='Bacon Burger', description='Beef patty with crispy bacon, cheese, lettuce, tomato', price=400, image='images/Bacon Burger.jpg', category_id=1),
                MenuItem(name='Margherita Pizza', description='Classic Italian pizza with tomato sauce, mozzarella cheese, and fresh basil', price=550, image='images/Margherita Pizza.jpg', category_id=2),
                MenuItem(name='Pepperoni Pizza', description='Tomato sauce, mozzarella cheese, and pepperoni slices', price=600, image='images/Pepperoni Pizza.jpg', category_id=2),
                MenuItem(name='Veggie Pizza', description='Loaded with mixed fresh vegetables and mozzarella cheese', price=650, image='images/Veggie Pizza.jpg', category_id=2),
                MenuItem(name='Cola', description='Refreshing cold cola drink', price=50, image='images/Cola.jpg', category_id=3),
                MenuItem(name='Lemonade', description='Freshly squeezed lemonade', price=120, image='images/Lemonade.jpg', category_id=3),
                MenuItem(name='Milkshake', description='Creamy vanilla milkshake', price=180, image='images/Milkshake.jpg', category_id=3),
                MenuItem(name='Chocolate Cake', description='Rich and moist chocolate cake', price=190, image='images/Chocolate Cake.jpg', category_id=4),
                MenuItem(name='Ice Cream', description='Smooth and creamy vanilla ice cream', price=200, image='images/Ice Cream.jpg', category_id=4),
                MenuItem(name='Cheesecake', description='Creamy New York style cheesecake', price=250, image='images/Cheesecake.jpg', category_id=4)
            ]
            db.session.add_all(menu_items)
            db.session.commit()
            print("Database initialized with sample data")


@app.route('/')
def index():
    categories = Category.query.all()
    return render_template('index.html', categories=categories)


@app.route('/menu')
def menu():
    categories = Category.query.all()
    return render_template('menu.html', categories=categories)


@app.route('/cart')
def cart():
    return render_template('cart.html')


@app.route('/orders')
def orders():
    return render_template('orders.html')


@app.route('/api/menu')
def api_menu():
    categories = Category.query.all()
    return jsonify([cat.to_dict() for cat in categories])


@app.route('/api/orders', methods=['GET', 'POST'])
def api_orders():
    if request.method == 'POST':
        data = request.get_json()
        
        items = data.get('items', [])
        if not items:
            return jsonify({'error': 'No items in order'}), 400
        
        total = sum(item['price'] * item['quantity'] for item in items)
        
        order = Order(
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data['customer_phone'],
            customer_address=data['customer_address'],
            total_amount=total
        )
        db.session.add(order)
        db.session.commit()
        
        for item in items:
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=item['id'],
                quantity=item['quantity'],
                price=item['price']
            )
            db.session.add(order_item)
        db.session.commit()
        
        return jsonify({'success': True, 'order_id': order.id})
    
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@app.route('/api/orders/<int:order_id>')
def api_order_detail(order_id):
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())


@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def api_update_order_status(order_id):
    data = request.get_json()
    order = Order.query.get_or_404(order_id)
    order.status = data.get('status', order.status)
    db.session.commit()
    return jsonify({'success': True})


if __name__ == '__main__':
    init_db()
    app.run(debug=True)