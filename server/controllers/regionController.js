const axios = require('axios');

const BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

const cache = {
  provinces: {
    data: null,
    timestamp: 0
  },
  cities: {}
};

const CACHE_DURATION = 60 * 60 * 1000;

exports.getAllProvinces = async (req, res) => {
  try {
    console.log('getAllProvinces called');
    const now = Date.now();
    if (cache.provinces.data && (now - cache.provinces.timestamp < CACHE_DURATION)) {
      return res.status(200).json({
        success: true,
        data: cache.provinces.data,
        fromCache: true
      });
    }
    const response = await axios.get(`${BASE_URL}/provinces.json`);
    const rawProvinces = response.data;
    const provinces = rawProvinces.map(province => ({
      id: province.id,
      name: province.name
    }));
    cache.provinces = {
      data: provinces,
      timestamp: now
    };
    res.status(200).json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    if (cache.provinces.data) {
      return res.status(200).json({
        success: true,
        data: cache.provinces.data,
        fromCache: true,
        cacheStatus: 'expired but used as fallback'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching provinces',
      error: error.message
    });
  }
};

exports.getCitiesByProvince = async (req, res) => {
  try {
    const { kode_provinsi } = req.params;
    if (!kode_provinsi) {
      return res.status(400).json({
        success: false,
        message: 'Province ID is required'
      });
    }
    const now = Date.now();
    if (cache.cities[kode_provinsi] && (now - cache.cities[kode_provinsi].timestamp < CACHE_DURATION)) {
      return res.status(200).json({
        success: true,
        data: cache.cities[kode_provinsi].data,
        fromCache: true
      });
    }
    const response = await axios.get(`${BASE_URL}/regencies/${kode_provinsi}.json`);
    const rawCities = response.data;
    const cities = rawCities.map(city => ({
      id: city.id,
      name: city.name
    }));
    cache.cities[kode_provinsi] = {
      data: cities,
      timestamp: now
    };
    res.status(200).json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error(`Error fetching cities for province ${req.params.kode_provinsi}:`, error);
    if (cache.cities[req.params.kode_provinsi]?.data) {
      return res.status(200).json({
        success: true,
        data: cache.cities[req.params.kode_provinsi].data,
        fromCache: true,
        cacheStatus: 'expired but used as fallback'
      });
    }
    res.status(500).json({
      success: false, 
      message: 'Error fetching cities',
      error: error.message
    });
  }
};