const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const seedUsers = async () => {
    try {
        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            await User.create({
                username: 'admin',
                password: 'adminpassword123', // Change this in production
                role: 'admin',
                name: 'System Admin',
                email: 'admin@college.edu'
            });
            console.log('Admin User Created');
        }

        // Check if exam head exists
        const examHeadExists = await User.findOne({ role: 'exam_head' });

        if (!examHeadExists) {
            await User.create({
                username: 'examhead',
                password: 'examheadpassword123',
                role: 'exam_head',
                name: 'Chief Examiner',
                email: 'examhead@college.edu'
            });
            console.log('Exam Head User Created');
        }

        // Check if transport dept exists
        const transportExists = await User.findOne({ role: 'transport_dept' });

        if (!transportExists) {
            await User.create({
                username: 'transport',
                password: 'transportpassword123',
                role: 'transport_dept',
                name: 'Transport Officer',
                email: 'transport@college.edu'
            });
            console.log('Transport User Created');
        }

        // Check if registrar exists
        const registrarExists = await User.findOne({ role: 'registrar' });

        if (!registrarExists) {
            await User.create({
                username: 'registrar',
                password: 'registrarpassword123',
                role: 'registrar',
                name: 'Student Registrar',
                email: 'registrar@college.edu'
            });
            console.log('Registrar User Created');
        }

    } catch (error) {
        console.error(`Seeder Error: ${error}`);
    }
};

module.exports = seedUsers;

// Run if called directly
if (require.main === module) {
    dotenv.config();
    connectDB();
    seedUsers().then(() => {
        console.log('Seeding Complete');
        process.exit();
    });
}
