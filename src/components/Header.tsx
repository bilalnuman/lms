"use client"
import React from 'react'
import Profile from './widgets/Profile'
import { Button } from './widgets/Button'

const Header = () => {
    return (
        <header className='z-[999] fixed w-full bg-gray-default text-white px-4 h-20 flex justify-between items-center'>
            <Button variant='ghost' as='a' href="/" className='!text-4xl uppercase font-bold text-dark-default' label="LMS" />
            <h1 className='text-xl font-bold text-dark-default'>Peaceful Nursing College (Trust) Lahore - Learning Management System</h1>
            <Profile />
        </header>
    )
}

export default Header