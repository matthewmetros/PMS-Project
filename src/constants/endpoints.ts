import { EndpointConfig } from '../types/pms.types';

export const MOCK_ENDPOINTS: Record<string, EndpointConfig> = {
  '/listings': {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    description: 'Property listings',
    parameters: {
      active: { type: 'boolean', description: 'Filter active listings' },
      city: { type: 'string', description: 'Filter by city' },
      bedrooms: { type: 'number', description: 'Number of bedrooms' },
      limit: { type: 'number', description: 'Results per page', default: 20 }
    }
  },
  '/reservations': {
    methods: ['GET', 'POST', 'PUT'],
    description: 'Booking reservations',
    parameters: {
      status: { type: 'enum', values: ['confirmed', 'pending', 'cancelled'], description: 'Booking status' },
      checkIn: { type: 'date', description: 'Check-in date' },
      checkOut: { type: 'date', description: 'Check-out date' },
      guestId: { type: 'string', description: 'Guest ID' },
      limit: { type: 'number', description: 'Results per page', default: 20 }
    }
  },
  '/guests': {
    methods: ['GET', 'POST', 'PUT'],
    description: 'Guest management',
    parameters: {
      email: { type: 'string', description: 'Guest email' },
      phone: { type: 'string', description: 'Guest phone' },
      name: { type: 'string', description: 'Guest name' },
      limit: { type: 'number', description: 'Results per page', default: 20 }
    }
  },
  '/calendar': {
    methods: ['GET', 'PUT'],
    description: 'Availability calendar',
    parameters: {
      propertyId: { type: 'string', description: 'Property ID', required: true },
      startDate: { type: 'date', description: 'Start date', required: true },
      endDate: { type: 'date', description: 'End date', required: true }
    }
  }
};