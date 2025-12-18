import React, { useState, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import * as DressService from '../services/DressService'
import * as bookcarsHelper from ':bookcars-helper'
import env from '../config/env.config'
import './MultipleImageUpload.css'

interface MultipleImageUploadProps {
  dressId?: string
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  readonly?: boolean
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  dressId,
  images,
  onImagesChange,
  maxImages = 10,
  readonly = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList) => {
    if (readonly || files.length === 0) return

    const remainingSlots = maxImages - images.length
    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      alert(`Maximum ${maxImages} images allowed. You currently have ${images.length} images.`)
      return
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const invalidFiles = filesToUpload.filter(file => !validTypes.includes(file.type))

    if (invalidFiles.length > 0) {
      alert('Please select only image files (JPEG, PNG, WebP)')
      return
    }

    // Validate file sizes (max 5MB per file)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const oversizedFiles = filesToUpload.filter(file => file.size > maxSize)

    if (oversizedFiles.length > 0) {
      alert('Some files are too large. Maximum file size is 5MB per image.')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      filesToUpload.forEach(file => {
        formData.append('images', file)
      })

      const result = await DressService.uploadMultipleImages(formData)
      
      if (dressId) {
        // If we have a dress ID, add images to the dress
        await DressService.addImages(dressId, result.filenames)
        const updatedDress = await DressService.getDress(dressId)
        onImagesChange(updatedDress.images || [])
      } else {
        // For create mode, just update the local state
        onImagesChange([...images, ...result.filenames])
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error uploading images: ${errorMessage}. Please try again.`)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (readonly) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!readonly) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }

  const handleDeleteImage = async (imageFilename: string) => {
    if (readonly) return

    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) return

    try {
      if (dressId) {
        await DressService.deleteImage(dressId, imageFilename)
        const updatedDress = await DressService.getDress(dressId)
        onImagesChange(updatedDress.images || [])
      } else {
        // For create mode, just remove from local state and delete temp file
        await DressService.deleteTempImage(imageFilename)
        onImagesChange(images.filter(img => img !== imageFilename))
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error deleting image. Please try again.')
    }
  }

  const handleReorder = async (result: DropResult) => {
    if (readonly || !result.destination) return

    const newImages = Array.from(images)
    const [reorderedItem] = newImages.splice(result.source.index, 1)
    newImages.splice(result.destination.index, 0, reorderedItem)

    onImagesChange(newImages)

    if (dressId) {
      try {
        await DressService.reorderImages(dressId, newImages)
      } catch (error) {
        console.error('Error reordering images:', error)
        // Revert on error
        onImagesChange(images)
      }
    }
  }

  const openFileDialog = () => {
    if (!readonly && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="multiple-image-upload">
      <div className="upload-header">
        <h3>Dress Images ({images.length}/{maxImages})</h3>
        {!readonly && (
          <button
            type="button"
            className="upload-button"
            onClick={openFileDialog}
            disabled={uploading || images.length >= maxImages}
          >
            {uploading ? 'Uploading...' : 'Add Images'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {images.length === 0 ? (
        <div
          className={`upload-dropzone ${dragOver ? 'drag-over' : ''} ${readonly ? 'readonly' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={readonly ? undefined : openFileDialog}
        >
          {readonly ? (
            <p>No images available</p>
          ) : (
            <>
              <p>Drag and drop images here or click to select</p>
              <p className="upload-hint">
                Supported formats: JPG, PNG, GIF, WebP (Max {maxImages} images)
              </p>
            </>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleReorder}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="images-grid"
              >
                {images.map((image, index) => (
                  <Draggable
                    key={image}
                    draggableId={image}
                    index={index}
                    isDragDisabled={readonly}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`image-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="image-container">
                          <img
                            src={bookcarsHelper.joinURL(
                              dressId ? env.CDN_DRESSES : env.CDN_TEMP_DRESSES,
                              image
                            )}
                            alt={`Dress image ${index + 1}`}
                          />
                          {!readonly && (
                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => handleDeleteImage(image)}
                              title="Delete image"
                            >
                              ×
                            </button>
                          )}
                          <div className="image-index">{index + 1}</div>
                          {index === 0 && (
                            <div className="primary-badge">Primary</div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {!readonly && images.length < maxImages && (
                  <div className="add-more-container">
                    <button
                      type="button"
                      className="add-more-button"
                      onClick={openFileDialog}
                      disabled={uploading}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>Uploading images...</p>
        </div>
      )}
    </div>
  )
}

export default MultipleImageUpload
