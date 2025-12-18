import React, { useState } from 'react'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { useLanguage } from '@/context/LanguageContext'
import { strings as headerStrings } from '@/lang/header'
import NotificationList from '@/components/NotificationList'

const Notifications = () => {
  const { language, isRTL } = useLanguage()
  const [user, setUser] = useState<bookcarsTypes.User>()

  const onLoad = async (_user?: bookcarsTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <NotificationList user={user} />
    </Layout>
  )
}

export default Notifications
