import { valid, inc, rcompare, ReleaseType } from 'semver'
import { GetSemVerResult } from './types/SemVer'
import { ApiTag } from './types/Api'

// Receive the next version type and a list of tags
function GetSemVer (releaseType: ReleaseType, tagList: ApiTag[]): GetSemVerResult {
  // Get current version from tag list
  const repositoryCurrentTag = tagList.sort((a, b) => rcompare(a.name, b.name))[0]?.name ?? '0.0.0' // Sort the list in descending order and get the first item, if it's null we set to the version 0

  // Get the valid current version
  const currentTag = valid(repositoryCurrentTag)

  // If has a version but it's invalid an error is thrown
  if (!currentTag) {
    throw new Error(`The tag "${repositoryCurrentTag}" received from GitHub is invalid.`)
  }

  // Get the next version
  const nextTag = inc(currentTag, releaseType)

  // If the next version is null or undefined thrown an error
  if (!nextTag) {
    throw new Error('Something went wrong while we trying to create the next version number')
  }

  // Return the current version and the next
  return {
    currentTag,
    nextTag
  }
}

export default GetSemVer
