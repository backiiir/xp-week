import { ConditionAccessorEnum, ConditionOperatorEnum, type PropertyBagProperty } from 'common';
import { usePropertiesStore } from './../stores/properties';

export function checkBag(
  accessor: string,
  key: string,
  value: string | number | boolean | Array<string | number>,
  operator: string,
): boolean {
  const store = usePropertiesStore();
  if (ConditionAccessorEnum.PropertyBag === accessor) {
    const propertyBag = store.getPropertyBagValuesAsObjectArray as PropertyBagProperty[];
    const property = propertyBag.find((prop) => prop.name === key);
    if (property) {
      return checkConditionPropertyBag(property.value, operator, value);
    }
  }

  if (ConditionAccessorEnum.GlobalBag === accessor) {
    if (typeof value === 'number' || typeof value === 'string') return checkConditionGlobalBag(operator, key, value);
  }
  return false;
}

function checkConditionPropertyBag(
  valueToCompare: string | number | boolean | Array<string | number>,
  operator: string,
  value: string | number | boolean | Array<string | number>,
): boolean {
  if (Array.isArray(valueToCompare) && Array.isArray(value)) {
    switch (operator) {
      case ConditionOperatorEnum.Equals:
        return Array.isArray(valueToCompare) && Array.isArray(value) && arraysEqual(valueToCompare, value);
      case ConditionOperatorEnum.NotEquals:
        return Array.isArray(valueToCompare) && Array.isArray(value) && !arraysEqual(valueToCompare, value);
      case ConditionOperatorEnum.Contains:
        return Array.isArray(valueToCompare) && Array.isArray(value) && value.every((elem) => valueToCompare.includes(elem));
      case ConditionOperatorEnum.NotContains:
        return Array.isArray(valueToCompare) && Array.isArray(value) && value.every((elem) => !valueToCompare.includes(elem));
      case ConditionOperatorEnum.GreaterThan:
      case ConditionOperatorEnum.LessThan:
        console.error('GreaterThan und LessThan sind für Array-Vergleiche nicht anwendbar.');
        return false;
      default:
        console.error('Unbekannter Fehler', value);
        return false;
    }
  }

  if (Array.isArray(valueToCompare) && !Array.isArray(value) && 'boolean' !== typeof value) {
    return checkValueInArray(valueToCompare, value, operator);
  }

  if (!Array.isArray(valueToCompare) && Array.isArray(value) && 'boolean' !== typeof valueToCompare) {
    return checkValueInArray(value, valueToCompare, operator);
  }

  if (!Array.isArray(valueToCompare) && !Array.isArray(value)) {
    switch (operator) {
      case ConditionOperatorEnum.Equals:
        return JSON.stringify(valueToCompare) === JSON.stringify(value);
      case ConditionOperatorEnum.NotEquals:
        return JSON.stringify(valueToCompare) !== JSON.stringify(value);
      case ConditionOperatorEnum.GreaterThan:
        return typeof valueToCompare === 'number' && typeof value === 'number' && valueToCompare > value;
      case ConditionOperatorEnum.LessThan:
        return typeof valueToCompare === 'number' && typeof value === 'number' && valueToCompare < value;
      case ConditionOperatorEnum.Contains:
      case ConditionOperatorEnum.NotContains:
        console.error('Contains und NotContains sind hier nicht anwendbar.');
        return false;
      default:
        console.error('Unbekannter Fehler', value);
        return false;
    }
  }
  return false;
}

function checkValueInArray(array: Array<string | number>, value: string | number, operator: string): boolean {
  switch (operator) {
    case ConditionOperatorEnum.Contains:
      return array.some((item) => item === value);
    case ConditionOperatorEnum.NotContains:
      return array.some((item) => item !== value);
    default:
      console.error('Unbekannter Fehler', value);
      return false;
  }
}

function arraysEqual(a: Array<string | number>, b: Array<string | number>): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

function checkConditionGlobalBag(operator: string, key: string, value: string | number) {
  const store = usePropertiesStore();
  if (ConditionOperatorEnum.GreaterThan === operator && typeof value === 'number' && key === 'timeelapsed') {
    return store.getTimeElapesed() > value;
  }

  if (typeof value === 'string' && key === 'absolutetime') {
    const now = new Date();
    const targetTimeParts = value.split(':');
    const targetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(targetTimeParts[0]),
      parseInt(targetTimeParts[1]),
    );

    if (ConditionOperatorEnum.GreaterThan === operator) {
      return now.getTime() > targetTime.getTime();
    }

    if (ConditionOperatorEnum.LessThan === operator) {
      return now.getTime() < targetTime.getTime();
    }
  }

  return false;
}
