import React from 'react'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { getDefaultUserAvatar } from '@/utils/avatarUtils'

import '@/assets/css/supplier-badge.css'

interface SupplierBadgeProps {
    supplier: bookcarsTypes.User
}

const SupplierBadge = ({ supplier }: SupplierBadgeProps) => {
    return supplier && (
        <div className="supplier-badge" title={supplier.fullName}>
            <a href={`/supplier?c=${supplier._id}`} className="supplier-badge-info">
                {supplier.fullName}
            </a>
        </div>
    )
}

export default SupplierBadge
