from app import app, db, User, bcrypt

with app.app_context():
    if not User.query.filter_by(email='test@example.com').first():
        hashed_password = bcrypt.generate_password_hash('password').decode('utf-8')
        user = User(username='test', email='test@example.com', password=hashed_password)
        db.session.add(user)
        db.session.commit()
        print("User 'test' created successfully.")
    else:
        print("User 'test' already exists.")
