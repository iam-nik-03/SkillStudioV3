import { isValid } from 'date-fns';

export const parseSafeDate = (dateVal: any): Date => {
  if (!dateVal) return new Date(0);
  if (dateVal instanceof Date) return dateVal;
  
  // Handle Firestore Timestamp
  if (dateVal && typeof dateVal === 'object' && 'seconds' in dateVal) {
    return new Date(dateVal.seconds * 1000);
  }
  
  // Handle strings or numbers
  const d = new Date(dateVal);
  return isValid(d) ? d : new Date(0);
};
