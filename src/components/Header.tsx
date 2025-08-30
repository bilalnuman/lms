import React from 'react'
import Profile from './Profile'
import { Button } from './Button'

const Header = () => {
    return (
        <header className='z-[999] fixed w-full bg-slate-800 text-white px-4 py-2 flex justify-between items-center'>
            <Button>Logo</Button>
            <h1 className='text-xs font-bold'>Peaceful Nursing College (Trust) Lahore - Learning Management System</h1>
            <Profile />
        </header>
    )
}

export default Header