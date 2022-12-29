import { metadata as pbFormConfig } from './Config'

export const translateLandCoverCode = (code) => {
  let translatedValue = '/'
  // These are the available land cover codes
  const landCoverCodes = pbFormConfig.schema.properties.LAND_COVER_CODE.enum
  // These are their translated values (names)
  const landCoverCodeNames = pbFormConfig.schema.properties.LAND_COVER_CODE.enumNames
  // Get the position of the land cover code
  const landCoverCodeIndex = landCoverCodes.indexOf(code)
  // If it's found (therefore the number will be 0 or larger than 0), get the appropriate name for the code
  if (landCoverCodeIndex >= 0) {
    translatedValue = landCoverCodeNames[landCoverCodeIndex]
  }

  return translatedValue
};
