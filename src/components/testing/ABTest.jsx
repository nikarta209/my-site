import React, { useState, useEffect } from 'react';

// A/B Test variants storage
const AB_TEST_STORAGE_KEY = 'kasbook_ab_variants';

// Available A/B tests configuration
const AB_TESTS = {
  'cta_button': {
    name: 'CTA Button Test',
    variants: {
      'control': { text: 'Читать сейчас', color: 'bg-[#4CAF50] hover:bg-[#388E3C]' },
      'variant_a': { text: 'Начать чтение', color: 'bg-blue-600 hover:bg-blue-700' },
      'variant_b': { text: 'Открыть книгу', color: 'bg-purple-600 hover:bg-purple-700' }
    },
    traffic: { control: 34, variant_a: 33, variant_b: 33 }
  },
  'banner_style': {
    name: 'Banner Style Test',
    variants: {
      'control': { gradient: 'from-gray-900 to-gray-700', overlay: 'bg-black/30' },
      'variant_a': { gradient: 'from-blue-900 to-blue-700', overlay: 'bg-blue-900/40' },
      'variant_b': { gradient: 'from-green-900 to-green-700', overlay: 'bg-green-900/40' }
    },
    traffic: { control: 34, variant_a: 33, variant_b: 33 }
  },
  'price_display': {
    name: 'Price Display Test', 
    variants: {
      'control': { format: 'price_only', emphasis: 'text-[#4CAF50]' },
      'variant_a': { format: 'with_usd', emphasis: 'text-blue-600' },
      'variant_b': { format: 'discount_style', emphasis: 'text-red-600' }
    },
    traffic: { control: 50, variant_a: 25, variant_b: 25 }
  }
};

// Get user's assigned variants from localStorage or assign new ones
const getUserVariants = () => {
  try {
    const stored = localStorage.getItem(AB_TEST_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading A/B test variants:', e);
  }
  
  return assignUserVariants();
};

// Assign user to variants based on traffic allocation
const assignUserVariants = () => {
  const variants = {};
  
  Object.entries(AB_TESTS).forEach(([testKey, testConfig]) => {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [variantKey, percentage] of Object.entries(testConfig.traffic)) {
      cumulative += percentage;
      if (rand <= cumulative) {
        variants[testKey] = variantKey;
        break;
      }
    }
  });
  
  // Save to localStorage
  try {
    localStorage.setItem(AB_TEST_STORAGE_KEY, JSON.stringify(variants));
  } catch (e) {
    console.error('Error saving A/B test variants:', e);
  }
  
  return variants;
};

// Hook for using A/B tests
export const useABTest = (testKey) => {
  const [userVariants, setUserVariants] = useState({});
  
  useEffect(() => {
    setUserVariants(getUserVariants());
  }, []);
  
  const variant = userVariants[testKey] || 'control';
  const config = AB_TESTS[testKey]?.variants[variant] || AB_TESTS[testKey]?.variants.control;
  
  return { variant, config };
};

// Component for tracking A/B test events
export const ABTestEvent = ({ testKey, event, data = {} }) => {
  useEffect(() => {
    const userVariants = getUserVariants();
    const variant = userVariants[testKey];
    
    if (variant) {
      // In a real app, send to analytics
      console.log('A/B Test Event:', {
        test: testKey,
        variant,
        event,
        data,
        timestamp: new Date().toISOString(),
        userId: `user_${Date.now()}` // Mock user ID
      });
      
      // Mock sending to analytics service
      // analytics.track('ab_test_event', { ... });
    }
  }, [testKey, event, data]);
  
  return null;
};

// A/B Test CTA Button Component
export const ABTestCTAButton = ({ children, onClick, className = "", ...props }) => {
  const { config } = useABTest('cta_button');
  
  const handleClick = (e) => {
    // Track conversion
    ABTestEvent({ testKey: 'cta_button', event: 'click' });
    onClick?.(e);
  };
  
  return (
    <button
      className={`${config?.color || 'bg-[#4CAF50] hover:bg-[#388E3C]'} text-white font-semibold py-2 px-4 rounded-lg transition-colors ${className}`}
      onClick={handleClick}
      {...props}
    >
      {config?.text || children || 'Читать сейчас'}
    </button>
  );
};

// A/B Test Banner Component
export const ABTestBanner = ({ children, className = "", ...props }) => {
  const { config } = useABTest('banner_style');
  
  return (
    <div
      className={`bg-gradient-to-r ${config?.gradient || 'from-gray-900 to-gray-700'} relative ${className}`}
      {...props}
    >
      <div className={`absolute inset-0 ${config?.overlay || 'bg-black/30'}`} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// A/B Test Price Display Component
export const ABTestPrice = ({ priceKAS, className = "" }) => {
  const { config } = useABTest('price_display');
  const priceUSD = (priceKAS * 0.12).toFixed(2);
  
  const renderPrice = () => {
    switch (config?.format) {
      case 'with_usd':
        return (
          <>
            <span className={`font-bold text-lg ${config?.emphasis}`}>{priceKAS} KAS</span>
            <span className="text-sm text-gray-500 ml-2">(${priceUSD})</span>
          </>
        );
      case 'discount_style':
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${config?.emphasis}`}>{priceKAS} KAS</span>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">HOT</span>
          </div>
        );
      default:
        return <span className={`font-bold text-lg ${config?.emphasis}`}>{priceKAS} KAS</span>;
    }
  };
  
  return <div className={className}>{renderPrice()}</div>;
};

// A/B Test Analytics Dashboard (for admin)
export const ABTestDashboard = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    // Mock analytics data
    const mockStats = Object.entries(AB_TESTS).map(([key, test]) => ({
      testKey: key,
      testName: test.name,
      variants: Object.keys(test.variants).map(variant => ({
        name: variant,
        traffic: test.traffic[variant],
        conversions: Math.floor(Math.random() * 100),
        conversionRate: (Math.random() * 0.15 + 0.05).toFixed(3)
      }))
    }));
    
    setStats(mockStats);
  }, []);
  
  if (!stats) return <div>Loading A/B test data...</div>;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">A/B Test Dashboard</h2>
      {stats.map(test => (
        <div key={test.testKey} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">{test.testName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {test.variants.map(variant => (
              <div key={variant.name} className="border p-4 rounded">
                <h4 className="font-medium">{variant.name}</h4>
                <p>Traffic: {variant.traffic}%</p>
                <p>Conversions: {variant.conversions}</p>
                <p>Rate: {variant.conversionRate}%</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};