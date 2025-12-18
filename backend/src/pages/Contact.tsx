import React, { useState } from 'react'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { useLanguage } from '@/context/LanguageContext'
import { strings as commonStrings } from '@/lang/common'
import ContactForm from '@/components/ContactForm'

import '@/assets/css/contact.css'

const Contact = () => {
  const { language, isRTL } = useLanguage()
  const [user, setUser] = useState<bookcarsTypes.User>()

  const onLoad = (_user?: bookcarsTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="contact">
        <ContactForm user={user} className="form" />
      </div>
    </Layout>
  )
}

export default Contact
