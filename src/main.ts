import * as core from '@actions/core'
import * as github from '@actions/github'
import GetSemVer from './SemVer'

(async function () {
  try {
    // Get the context payload
    const payload = github.context.payload

    // Check if it's a PR event
    if (!payload.pull_request || !payload.pull_request.merged) {
      throw new Error('This action can only be used by a Pull Request merge event.')
    }

    /**
     * Getting all the Action Inputs
     */
    const githubToken = core.getInput('github-token')
    const vPrefix = core.getInput('v-prefix') === 'true'

    /**
     * Create an octokit client
     */
    const octokitClient = github.getOctokit(githubToken)

    /**
     * Create all variables
     */
    const { owner, repo } = github.context.repo
    const contextSha = github.context.sha
    const releaseTitle = payload.pull_request.title
    const releaseBody = payload.pull_request.body
    const allowedTags = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease']
    const releaseType = payload.pull_request.labels.find((label: { name: string }) => allowedTags.includes(label.name))?.name
    const userData = (await octokitClient.rest.users.getAuthenticated()).data

    /**
     * Variables validations
     */
    if (!userData || !userData.name || !userData.email) {
      throw new Error('We can\'t find the token info')
    }

    if (!releaseType) {
      throw new Error(`The PR hasn't any valid release type. The values can be one of this: ${allowedTags.join(', ')}.`)
    }

    /**
     * Action steps
     */
    // -- Get repository tag list
    const tagList = await octokitClient.rest.repos.listTags({
      owner,
      repo
    })
    // Defining the current tag and the next
    const { currentTag, nextTag } = GetSemVer(releaseType, tagList.data, vPrefix)
    core.info(`Current tag: ${currentTag}`)
    core.info(`Next tag: ${nextTag}`)

    // -- Create tag
    const tagData = await octokitClient.rest.git.createTag({
      owner,
      repo,
      tag: nextTag,
      message: releaseTitle,
      object: contextSha,
      type: 'commit',
      tagger: {
        name: userData.name,
        email: userData.email
      }
    })
    core.info(`Tag ${nextTag} criada com sucesso!`)

    // -- Create the tag reference
    await octokitClient.rest.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${nextTag}`,
      sha: tagData.data.sha
    })
    core.info(`Referência da tag ${nextTag} criada com sucesso!`)

    // -- Create release
    const releaseData = await octokitClient.rest.repos.createRelease({
      owner,
      repo,
      tag_name: nextTag,
      name: releaseTitle,
      body: releaseBody
    })
    core.info(`Release ${nextTag} criado com sucesso!`)

    /**
     * Outputs
     */
    core.setOutput('tag', nextTag)
    core.setOutput('release_url', releaseData.data.html_url)
  } catch (error) {
    core.setFailed((error as any).message)
  }
})()
