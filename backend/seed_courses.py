from app import app, db, Course, Lesson, Question

def seed_courses():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        print("Database reset.")

        # Create a Course
        python_course = Course(
            title="Python for Beginners",
            description="Learn the basics of Python programming.",
            image_url="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg"
        )
        db.session.add(python_course)
        db.session.commit()

        # Create Lessons
        lesson1 = Lesson(
            title="Introduction to Python",
            content="# Welcome to Python\nPython is a high-level, interpreted programming language known for its readability.",
            course_id=python_course.id
        )
        
        lesson2 = Lesson(
            title="Variables and Data Types",
            content="# Variables\nVariables are containers for storing data values.\n\n```python\nx = 5\ny = 'Hello'\n```",
            course_id=python_course.id
        )
        
        db.session.add_all([lesson1, lesson2])
        db.session.commit()

        # Create Questions for Lesson 1
        q1 = Question(
            question_text="What type of language is Python?",
            options=["Compiled", "Interpreted", "Assembly", "Machine Code"],
            correct_answer="Interpreted",
            lesson_id=lesson1.id
        )
        
        # Create Questions for Lesson 2
        q2 = Question(
            question_text="How do you declare a variable in Python?",
            options=["var x = 5", "int x = 5", "x = 5", "declare x = 5"],
            correct_answer="x = 5",
            lesson_id=lesson2.id
        )

        db.session.add_all([q1, q2])
        db.session.commit()
        
        print("Sample courses and lessons added!")

if __name__ == "__main__":
    seed_courses()
