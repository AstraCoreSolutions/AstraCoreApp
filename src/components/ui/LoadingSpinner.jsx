import React from 'react'
import { cn } from '../../utils/helpers'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = '',
  overlay = false,
  fullScreen = false 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  }

  const colorClasses = {
    primary: 'border-astra-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    success: 'border-success-600 border-t-transparent',
    warning: 'border-warning-600 border-t-transparent',
    error: 'border-error-600 border-t-transparent'
  }

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  }

  const textColorClasses = {
    primary: 'text-astra-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600'
  }

  const spinnerElement = (
    <div className={cn(
      'border-2 rounded-full animate-spin',
      sizeClasses[size],
      colorClasses[color],
      className
    )} />
  )

  const content = (
    <div className="flex flex-col items-center justify-center space-y-2">
      {spinnerElement}
      {text && (
        <p className={cn(
          'font-medium',
          textSizeClasses[size],
          textColorClasses[color]
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-10">
        {content}
      </div>
    )
  }

  if (text) {
    return content
  }

  return spinnerElement
}

// Skeleton Loading Component
export const SkeletonLoader = ({ 
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  count = 1,
  space = 'space-y-2'
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={cn(
        'animate-pulse bg-gray-200',
        width,
        height,
        rounded,
        className
      )}
    />
  ))

  if (count === 1) {
    return skeletons[0]
  }

  return (
    <div className={space}>
      {skeletons}
    </div>
  )
}

// Card Skeleton for loading states
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={cn('card p-6', className)}>
      <div className="animate-pulse space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <SkeletonLoader width="w-32" height="h-6" />
          <SkeletonLoader width="w-16" height="h-4" rounded="rounded-full" />
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <SkeletonLoader height="h-4" />
          <SkeletonLoader width="w-3/4" height="h-4" />
          <SkeletonLoader width="w-1/2" height="h-4" />
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-4">
          <SkeletonLoader width="w-20" height="h-4" />
          <SkeletonLoader width="w-24" height="h-8" rounded="rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Table Skeleton for loading states
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) => {
  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="animate-pulse">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-3">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, index) => (
              <SkeletonLoader key={index} width="w-20" height="h-4" />
            ))}
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }, (_, colIndex) => (
                  <SkeletonLoader 
                    key={colIndex} 
                    width={colIndex === 0 ? "w-32" : "w-24"} 
                    height="h-4" 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Chart Skeleton for loading states
export const ChartSkeleton = ({ 
  type = 'bar',
  className = '' 
}) => {
  return (
    <div className={cn('card p-6', className)}>
      <div className="animate-pulse space-y-4">
        {/* Chart Title */}
        <div className="flex items-center justify-between">
          <SkeletonLoader width="w-32" height="h-6" />
          <SkeletonLoader width="w-20" height="h-4" />
        </div>
        
        {/* Chart Area */}
        <div className="h-64 bg-gray-100 rounded-lg flex items-end justify-around p-4">
          {type === 'bar' && Array.from({ length: 6 }, (_, index) => (
            <SkeletonLoader
              key={index}
              width="w-8"
              height={`h-${Math.floor(Math.random() * 40) + 20}`}
              className="bg-gray-200"
            />
          ))}
          
          {type === 'line' && (
            <div className="w-full h-full bg-gray-200 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
            </div>
          )}
          
          {type === 'pie' && (
            <div className="w-40 h-40 bg-gray-200 rounded-full relative overflow-hidden mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
            </div>
          )}
        </div>
        
        {/* Chart Legend */}
        <div className="flex justify-center space-x-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <SkeletonLoader width="w-3" height="h-3" rounded="rounded-full" />
              <SkeletonLoader width="w-16" height="h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Page Loading Component
export const PageLoader = ({ 
  text = 'Načítání...',
  description = ''
}) => {
  return (
    <div className="min-h-screen-75 flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" color="primary" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">{text}</h3>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Button Loading State
export const ButtonLoader = ({ 
  size = 'sm',
  color = 'white',
  text = '',
  className = ''
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <LoadingSpinner size={size} color={color} />
      {text && <span className="ml-2">{text}</span>}
    </div>
  )
}

// Dots Loading Animation
export const DotsLoader = ({ 
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const colorClasses = {
    primary: 'bg-astra-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600'
  }

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

export default LoadingSpinner
