"use client"
import React from 'react'
import Profile from './Profile'
import { Button } from './Button'

const Header = () => {
    return (
        <header className='z-[999] fixed w-full bg-gray-default text-white px-4 py-2 flex justify-between items-center'>
            <Button variant='ghost' as='a' href="/" className='!text-4xl uppercase font-bold text-dark-default'>lms</Button>
            <h1 className='text-xs font-bold text-dark-default'>Peaceful Nursing College (Trust) Lahore - Learning Management System</h1>
            <Profile />
        </header>
    )
}

export default Header