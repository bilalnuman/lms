"use client"
import React from 'react'
import { Button } from './Button'
import { IoSettingsOutline } from "react-icons/io5";
import { IoIosLogOut } from "react-icons/io";
import { Dropdown } from './Dropdown';



const Profile = () => {
  return (
    <Dropdown
      label='MB'
      classNames={{
        label: "w-9 h-9 bg-red-500 rounded-full"
      }}
      dropdown={{ right: 15, left: "unset"}}
    >
      <Button variant='ghost' as='a' href='/' leftIcon={<IoSettingsOutline size={20} />}>
        Change password</Button>
      <Button variant='ghost' as='a' href='/' leftIcon={<IoIosLogOut size={20} />} className='justify-start'>Logout</Button>
    </Dropdown>
  )
}

export default Profile