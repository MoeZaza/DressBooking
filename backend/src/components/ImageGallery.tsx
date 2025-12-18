import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import * as bookcarsHelper from ':bookcars-helper'
import env from '../config/env.config'
import './ImageGallery.css'

interface ImageGalleryProps {
  images: string[]
  alt?: string
  onReorder?: (newOrder: string[]) => void
  onDelete?: (imageFilename: string) => void
  editable?: boolean
  maxHeight?: number
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  alt = 'Gallery image',
  onReorder,
  onDelete,
  editable = false,
  maxHeight = 300
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="image-gallery-empty">
        <div className="empty-icon">📷</div>
        <p>No images available</p>
        {editable && <p className="empty-hint">Upload images to get started</p>}
      </div>
    )
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return

    const items = Array.from(images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onReorder(items)
  }

  const handleDelete = (imageFilename: string) => {
    if (onDelete && window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      onDelete(imageFilename)
    }
  }

  const handleImageClick = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (editable && onReorder) {
    return (
      <div className="image-gallery">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="image-gallery-grid"
              >
                {images.map((image, index) => (
                  <Draggable key={image} draggableId={image} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`image-gallery-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="image-container">
                          <img
                            src={bookcarsHelper.joinURL(env.CDN_DRESSES, image)}
                            alt={`${alt} ${index + 1}`}
                            style={{ maxHeight }}
                            onClick={() => handleImageClick(index)}
                          />
                          {onDelete && (
                            <button
                              className="delete-button"
                              onClick={() => handleDelete(image)}
                              title="Delete this image permanently"
                              aria-label="Delete image"
                            >
                              ×
                            </button>
                          )}
                          <div className="image-index">{index + 1}</div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Lightbox */}
        {lightboxOpen && (
          <div className="lightbox" onClick={() => setLightboxOpen(false)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="lightbox-close"
                onClick={() => setLightboxOpen(false)}
              >
                ×
              </button>
              
              <img
                src={bookcarsHelper.joinURL(env.CDN_DRESSES, images[currentIndex])}
                alt={`${alt} ${currentIndex + 1}`}
                className="lightbox-image"
              />

              {images.length > 1 && (
                <>
                  <button className="lightbox-nav lightbox-prev" onClick={handlePrevious}>
                    ‹
                  </button>
                  <button className="lightbox-nav lightbox-next" onClick={handleNext}>
                    ›
                  </button>
                  <div className="lightbox-counter">
                    {currentIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Non-editable gallery
  return (
    <div className="image-gallery">
      <div className="image-gallery-main">
        <img
          src={bookcarsHelper.joinURL(env.CDN_DRESSES, images[currentIndex])}
          alt={`${alt} ${currentIndex + 1}`}
          style={{ maxHeight, width: '100%', objectFit: 'cover' }}
          onClick={() => handleImageClick(currentIndex)}
        />
        
        {images.length > 1 && (
          <>
            <button className="nav-button nav-prev" onClick={handlePrevious}>
              ‹
            </button>
            <button className="nav-button nav-next" onClick={handleNext}>
              ›
            </button>
            <div className="image-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="image-gallery-thumbnails">
          {images.map((image, index) => (
            <img
              key={index}
              src={bookcarsHelper.joinURL(env.CDN_DRESSES, image)}
              alt={`${alt} thumbnail ${index + 1}`}
              className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setLightboxOpen(false)}
            >
              ×
            </button>
            
            <img
              src={bookcarsHelper.joinURL(env.CDN_DRESSES, images[currentIndex])}
              alt={`${alt} ${currentIndex + 1}`}
              className="lightbox-image"
            />

            {images.length > 1 && (
              <>
                <button className="lightbox-nav lightbox-prev" onClick={handlePrevious}>
                  ‹
                </button>
                <button className="lightbox-nav lightbox-next" onClick={handleNext}>
                  ›
                </button>
                <div className="lightbox-counter">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery
