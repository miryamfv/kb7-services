/**
 * Copyright (c) Kernel
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useServices, FooterSmall, Navbar } from '@kernel/common'

import Sidebar from './../components/Sidebar.js'

const ADMIN_ROLE = 100 

const Dashboard = () => {

  const navigate = useNavigate()
  const { state, walletLogin, services, currentUser } = useServices()

  const user = currentUser()

  useEffect(() => {
    //TODO: expired token
    if (!user || user.role > ADMIN_ROLE) {
      return navigate('/')
    }
  }, [])

  return (
    <>
      <Sidebar /> 
      <div className="absoulte h-full w-full md:ml-64">
        <Navbar />
        {/* Header */}
        <div className="relative bg-amber-200 md:pt-32 pb-32 pt-12">
          <div className="px-4 md:px-10 mx-auto w-full">
          </div>
        </div>
        <div className="px-4 md:px-10 mx-auto w-full">
          <div className="flex flex-wrap">
          </div>
          <div className="flex flex-wrap mt-4">
          </div>
        </div>
        <FooterSmall absolute />
      </div>
    </>
  )
}

export default Dashboard