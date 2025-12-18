import React from 'react'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import Slick from '@/components/Slick'

import '@/assets/css/supplier-carrousel.css'

interface SupplierCarrouselProps {
  suppliers: bookcarsTypes.User[]
}

const settings = {
  infinite: true,
  speed: 3 * 1000,
  slidesToShow: env.isMobile ? 2 : 6,
  autoplay: true,
  autoplaySpeed: 3 * 1000,
  centerMode: true,
  arrows: false,
  dots: false,
  touchMove: false,
  centerPadding: '64px',
  pauseOnHover: false,
}

const SupplierCarrousel = ({ suppliers }: SupplierCarrouselProps) => (
  <Slick {...settings} className="supplier-carrousel">
    {
      suppliers.map((supplier) => (
        <div key={supplier._id}>
          <div key={supplier._id} className="supplier-container">
            <div className="supplier-name" title={supplier.fullName}>
              {supplier.fullName}
            </div>
          </div>
        </div>
      ))
    }
  </Slick>
)

export default SupplierCarrousel
