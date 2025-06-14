'use client'
import { useState, useCallback, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import { CalendarIcon, PlayIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import GoogleMap from '@/components/GoogleMap'
import { WarehouseLocation, fetchWarehouseLocations } from '@/actions/warehouse'
import { PincodePoint, fetchPincodeLocations } from '@/actions/pincode'
import { OrderLocationData, fetchOrderLocationData } from '@/actions/order'
//30 days date range
const getDefaultDateRange = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  return {
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  }
}
export default function Dashboard() {
  const [showWarehouses, setShowWarehouses] = useState(false)
  const [showPincodes, setShowPincodes] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([])
  const [pincodes, setPincodes] = useState<PincodePoint[]>([])
  const [orderData, setOrderData] = useState<OrderLocationData[]>([])
  const [loading, setLoading] = useState({ warehouses: false, pincodes: false, orders: false })
  const [errors, setErrors] = useState({ warehouses: '', pincodes: '', orders: '' })
  const [selectedMetric, setSelectedMetric] = useState<string>('cust_count')
  const [dateRange, setDateRange] = useState(getDefaultDateRange())
  const [showHeatmapDropdown, setShowHeatmapDropdown] = useState(false)
  const [showCircles, setShowCircles] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const metricOptions = [
    { key: 'cust_count', label: 'Customer Count' },
    { key: 'so_count', label: 'Sales Order Count' },
    { key: 'order_value', label: 'Order Value' },
    { key: 'volume', label: 'Volume' }
  ]

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Auto-collapse logic
  const shouldAutoCollapse = useCallback(() => {
    if (showHeatmap && showHeatmapDropdown) {
      return false
    }
    return true
  }, [showHeatmap, showHeatmapDropdown])

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleToggle = useCallback(async (
    type: 'warehouses' | 'pincodes' | 'circles',
    isSelected: boolean
  ) => {
    if (type === 'circles') {
      setShowCircles(isSelected)
       if (isSelected && warehouses.length === 0) {
        setLoading(prev => ({ ...prev, warehouses: true }))
        setErrors(prev => ({ ...prev, warehouses: '' }))
        try {
          const response = await fetchWarehouseLocations()

          if (response?.results) {
            setWarehouses(response.results as WarehouseLocation[])
          } else {
            throw new Error('No warehouse data received')
          }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch warehouses'
            setErrors(prev => ({ ...prev, warehouses: message }))
            setShowCircles(false) // Turn circles back off if loading fails
        } finally {
            setLoading(prev => ({ ...prev, warehouses: false }))
        }
      }
      if (shouldAutoCollapse()) {
        setTimeout(() => setIsMenuOpen(false), 300)
      } return
    }
    const isWarehouse = type === 'warehouses'
    const setter = isWarehouse ? setShowWarehouses : setShowPincodes
    const data = isWarehouse ? warehouses : pincodes
    setter(isSelected)
    if (type === 'warehouses' && isSelected) {
      setShowCircles(true)
    }
    if (shouldAutoCollapse()) {
      setTimeout(() => setIsMenuOpen(false), 300)
    }

    if (!isSelected || data.length > 0) return
    setLoading(prev => ({ ...prev, [type]: true }))
    setErrors(prev => ({ ...prev, [type]: '' }))

    try {
      const response = await (isWarehouse 
        ? fetchWarehouseLocations()
        : fetchPincodeLocations(showWarehouses ? warehouses.map(w => w.Warehouse).join(',') : '')
      )
      
      if (response?.results) {
        if (isWarehouse) {
          setWarehouses(response.results as WarehouseLocation[])
        } else {
          setPincodes(response.results as PincodePoint[])
        }
      } else {
          throw new Error(`No ${type} data received`)
      }

      
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to fetch ${type}`
      setErrors(prev => ({ ...prev, [type]: message }))
      setter(false)
      if (type === 'warehouses') {
        setShowCircles(false)
      }
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }, [warehouses, pincodes, shouldAutoCollapse, showWarehouses])

  const fetchOrderData = useCallback(async (fromDate: string, toDate: string, metric: string) => {
    setLoading(prev => ({ ...prev, orders: true }))
    setErrors(prev => ({ ...prev, orders: '' }))

    try {
      const response = await fetchOrderLocationData(
        fromDate,
        toDate,
        metric
      )
      
      if (response?.results) {
        setOrderData(response.results)
      } else {
        throw new Error('No order data received')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch order data'
      setErrors(prev => ({ ...prev, orders: message }))
      console.error('Error fetching order data:', err)
    } finally {
      setLoading(prev => ({ ...prev, orders: false }))
    }
  }, [])

  const handleHeatmapToggle = useCallback((isSelected: boolean) => {
    setShowHeatmap(isSelected)
    if (!isSelected) {
      setOrderData([])
      setErrors(prev => ({ ...prev, orders: '' }))
      setShowHeatmapDropdown(false)
      // Auto-collapse when turning off
      if (shouldAutoCollapse()) {
        setTimeout(() => setIsMenuOpen(false), 300)
      }
    }
  }, [shouldAutoCollapse])

  const handleGenerateHeatmap = useCallback(async () => {
    await fetchOrderData(dateRange.from, dateRange.to, selectedMetric)
    // Auto-collapse after generating
    if (shouldAutoCollapse()) {
      setTimeout(() => {
        setShowHeatmapDropdown(false)
        setIsMenuOpen(false)
      }, 300)
    }
  }, [fetchOrderData, dateRange.from, dateRange.to, selectedMetric, shouldAutoCollapse])

  const handleMetricChange = useCallback((metric: string) => {
    setSelectedMetric(metric)
    
    // Clear any previous errors when metrics change
    if (errors.orders) {
      setErrors(prev => ({ ...prev, orders: '' }))
    }
  }, [errors.orders])

  const handleDateChange = useCallback((field: 'from' | 'to', value: string) => {
    const updatedRange = { ...dateRange, [field]: value }
    setDateRange(updatedRange)
    
    // Clear any previous errors when date changes
    if (errors.orders) {
      setErrors(prev => ({ ...prev, orders: '' }))
    }
  }, [dateRange, errors.orders])

  const uniqueWarehouseCount = new Set(pincodes.map(p => p.WH)).size
return (
    <div className="relative w-full h-screen bg-black text-black overflow-hidden">
      {/* Hamburger Menu Button */}
      <div className={`absolute top-2 left-2 z-50 ${isFullscreen ? 'fixed' : ''}`}>
        <button
          onClick={handleMenuToggle}
          className="flex items-center justify-center w-10 h-10 bg-black/20 backdrop-blur-md rounded-lg border border-black/10 hover:bg-black/20 transition-colors"
        >
          {isMenuOpen ? (
            <XMarkIcon className="h-5 w-5 text-black" />
          ) : (
            <Bars3Icon className="h-5 w-5 text-black" />
          )}
        </button>
      </div>

      {/* Hamburger Menu Panel */}
      <div className={`${isFullscreen ? 'fixed' : 'absolute'} top-14 left-2 z-50 transition-all duration-200  ${
        isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-black/10 backdrop-blur-md rounded-lg border border-white/10 p-4 min-w-[280px] max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-3">
            <ToggleControl
              checked={showWarehouses}
              onChange={(checked) => handleToggle('warehouses', checked)}
              loading={loading.warehouses}
              label="Warehouses"
              color="blue"
            />
            <ToggleControl
              checked={showCircles}
              onChange={(checked) => handleToggle('circles', checked)}
              loading={false}
              label="Circles"
              color="blue"
            />
            <ToggleControl
              checked={showPincodes}
              onChange={(checked) => handleToggle('pincodes', checked)}
              loading={loading.pincodes}
              label="Pincodes"
              color="green"
            />

            
            {/* Heatmap Control */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
              <Switch
                checked={showHeatmap}
                onChange={handleHeatmapToggle}
                disabled={loading.orders}
                className={`${showHeatmap ? 'bg-red-500' : 'bg-gray-500'} ${
                  loading.orders ? 'opacity-50' : ''
                } relative inline-flex h-4 w-8 rounded-full border-2 border-transparent transition-colors duration-200`}
              >
                <span className={`${showHeatmap ? 'translate-x-4' : 'translate-x-0'} 
                  inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition duration-200`} />
              </Switch>
              <span className="text-xs font-medium select-none">
                {loading.orders ? 'Loading...' : 'Reports'}
              </span>
            </div>

            {/* Metrics Selection - Only show when heatmap is enabled */}
            {showHeatmap && (
              <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/10">
                <h4 className="text-xs font-medium mb-2 text-black">Metrics</h4>
                <div className="space-y-1.5">
                  {metricOptions.map(option => (
                    <div key={option.key} className="flex items-center justify-between">
                      <span className="text-xs text-black">{option.label}</span>
                      <Switch
                        checked={selectedMetric === option.key}
                        onChange={() => handleMetricChange(option.key)}
                        className={`${selectedMetric === option.key ? 'bg-red-500' : 'bg-gray-500'} 
                          relative inline-flex h-3 w-6 rounded-full border-2 border-transparent transition-colors duration-200`}
                      >
                        <span className={`${selectedMetric === option.key ? 'translate-x-3' : 'translate-x-0'} 
                          inline-block h-2 w-2 transform rounded-full bg-white shadow-lg transition duration-200`} />
                      </Switch>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range - Only show when heatmap is enabled */}
            {showHeatmap && (
              <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/10">
                <h4 className="text-xs font-medium mb-2 flex items-center gap-1 text-black">
                  <CalendarIcon className="h-3 w-3" />
                  Date Range
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-black/70">From</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => handleDateChange('from', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded focus:ring-1 focus:ring-red-500/50 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-black/70">To</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => handleDateChange('to', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded focus:ring-1 focus:ring-red-500/50 text-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button - Only show when heatmap is enabled */}
            {showHeatmap && (
              <button
                onClick={handleGenerateHeatmap}
                disabled={loading.orders}
                className={`w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  loading.orders
                    ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-md'
                }`}
              >
                {loading.orders ? (
                  <>
                    <div className="animate-spin h-3 w-3 border border-white/30 border-t-white rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-3 w-3" />
                    Generate Heatmap
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <GoogleMap 
        warehouses={warehouses}
        pincodes={pincodes}
        orderData={orderData}
        showWarehouses={showWarehouses}
        showPincodes={showPincodes}
        showHeatmap={showHeatmap}
        showCircles={showCircles}
        selectedMetrics={[selectedMetric]}
        // isLoading={loading.warehouses || loading.pincodes || loading.orders}
        // isPincodeLoading={loading.pincodes}
        loading={loading}
      />

      {/* Status - legends */}
      <div className={`absolute bottom-2 left-4 z-40 flex gap-2 ${isFullscreen ? 'fixed' : ''}`}>
        <StatusCard
          show={showWarehouses || loading.warehouses || !!errors.warehouses}
          loading={loading.warehouses}
          error={errors.warehouses}
          count={warehouses.length}
          label="warehouse"
          color="blue"
        />
        <StatusCard
          show={showPincodes || loading.pincodes || !!errors.pincodes}
          loading={loading.pincodes}
          error={errors.pincodes}
          count={pincodes.length}
          label="pincode"
          color="green"
          extra={uniqueWarehouseCount > 0 ? `${uniqueWarehouseCount} warehouses serving` : undefined}
        />
        <StatusCard
          show={showHeatmap || loading.orders || !!errors.orders}
          loading={loading.orders}
          error={errors.orders}
          count={orderData.length}
          label="order location"
          color="red"
          extra={selectedMetric ? `Metric: ${metricOptions.find(m => m.key === selectedMetric)?.label}` : undefined}
        />
      </div>
    </div>
  )
}

// Helper Components
function ToggleControl({ checked, onChange, loading, label, color }: {
  checked: boolean
  onChange: (checked: boolean) => void
  loading: boolean
  label: string
  color: 'blue' | 'green'
}) {
  const colorClass = color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
  
  return (
    <div className="flex items-center gap-1 bg-white/15 px-2 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={loading}
        className={`${checked ? colorClass : 'bg-gray-500'} ${
          loading ? 'opacity-50' : ''
        } relative inline-flex h-4 w-8 rounded-full border-2 border-transparent transition-colors duration-200`}
      >
        <span className={`${checked ? 'translate-x-4' : 'translate-x-0'} 
          inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition duration-200`} />
      </Switch>
      <span className="text-xs font-medium select-none text-black">
        {loading ? 'Loading...' : `Show ${label}`}
      </span>
    </div>
  )
}

function StatusCard({ show, loading, error, count, label, color, extra }: {
  show: boolean
  loading: boolean  
  error: string
  count: number
  label: string
  color: 'blue' | 'green' | 'red'
  extra?: string
}) {
  if (!show) return null

  const colorClass = color === 'blue' ? 'text-blue-300' : color === 'green' ? 'text-green-300' : 'text-red-300'
  const bgClass = color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : 'bg-red-500'

  return (
    <div className="bg-black/50 backdrop-blur-md rounded-lg p-2 border border-white/10">
      {loading && (
        <div className="flex items-center gap-1">
          <div className={`animate-spin h-3 w-3 border-2 border-${color}-400 border-t-transparent rounded-full`} />
          <p className={`${colorClass} text-xs`}>Loading {label}s...</p>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-red-500 rounded-full" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
      
      {!loading && !error && count > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className={`h-3 w-3 ${bgClass} rounded-full`} />
            <p className={`${colorClass} text-xs`}>
              {count} {label}{count !== 1 ? 's' : ''}
            </p>
          </div>
          {extra && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-yellow-400 rounded-full" />
              <p className="text-yellow-300 text-xs">{extra}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}