import * as core from '@actions/core'
import * as github from '@actions/github'
import GetSemVer from './SemVer'

(async function () {
  try {
    /**
     * Getting all the Action Inputs
     */
    const githubToken = core.getInput('github-token')

    /**
     * Create variables
     */
    const payload = github.context.payload
    const { owner, repo } = github.context.repo

    /**
     * Create an octokit client
     */
    const octokitClient = github.getOctokit(githubToken)

    /**
     * Deal with tags
     */
    const tagList = await octokitClient.rest.repos.listTags({
      owner,
      repo
    })
    const { currentTag, nextTag } = GetSemVer('minor', tagList.data)
    core.info(`Current version: ${currentTag}`)
    core.info(`Next version: ${nextTag}`)

    /**
     * Logs
     */
    core.info(`The event payload: ${JSON.stringify(payload)}`)

    /**
     * Outputs
     */
  } catch (error) {
    core.setFailed((error as any).message)
  }
})()
