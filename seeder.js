const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
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
            console.log('Admin User Created: username=admin, password=adminpassword123');
        } else {
            console.log('Admin User already exists');
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
            console.log('Exam Head User Created: username=examhead, password=examheadpassword123');
        } else {
            console.log('Exam Head User already exists');
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
            console.log('Transport User Created: username=transport, password=transportpassword123');
        } else {
            console.log('Transport User already exists');
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
            console.log('Registrar User Created: username=registrar, password=registrarpassword123');
        } else {
            console.log('Registrar User already exists');
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
