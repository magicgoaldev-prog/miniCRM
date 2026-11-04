export type Locale = 'ru' | 'en'

export type MessageTree = {
  brand: {
    name: string
    tagline: string
  }
  nav: {
    sites: string
    myTasks: string
    profile: string
    signOut: string
    language: string
  }
  roles: {
    assigner: string
    executor: string
  }
  status: {
    new: string
    in_progress: string
    on_review: string
    rework: string
    accepted: string
  }
  actions: {
    startWork: string
    submitReview: string
    resumeWork: string
    accept: string
    returnRework: string
    cancel: string
    create: string
    save: string
    saving: string
    edit: string
    delete: string
    newSite: string
    newTask: string
    signIn: string
    signingIn: string
    back: string
  }
  common: {
    name: string
    address: string
    title: string
    description: string
    assignee: string
    author: string
    created: string
    status: string
    task: string
    site: string
    comment: string
    loadingSession: string
    noDescription: string
  }
  login: {
    lede: string
    email: string
    password: string
  }
  sites: {
    title: string
    ledeAssigner: string
    ledeExecutor: string
    empty: string
    dialogTitle: string
    dialogLede: string
  }
  siteDetail: {
    tasks: string
    empty: string
    editTitle: string
    createTitle: string
    createLede: string
    deleteConfirm: string
  }
  myTasks: {
    title: string
    lede: string
    empty: string
  }
  taskDetail: {
    availableActions: string
    commentPlaceholder: string
    history: string
    historyEmpty: string
    createdAs: string
    editTitle: string
    reassignHint: string
    reassignLocked: string
    deleteConfirm: string
  }
  profile: {
    title: string
    lede: string
    account: string
    identity: string
    access: string
    email: string
    fullName: string
    role: string
    memberSince: string
    userId: string
    languagePreference: string
    languageHint: string
    session: string
    signedInAs: string
    workspace: string
  }
  errors: {
    AUTH_REQUIRED: string
    FORBIDDEN_ROLE: string
    TASK_NOT_FOUND: string
    TASK_TRANSITION_FORBIDDEN: string
    TASK_COMMENT_REQUIRED: string
    TASK_REASSIGN_NOT_ALLOWED: string
    TASK_STATUS_IMMUTABLE_VIA_UPDATE: string
    TASK_FIELD_UPDATE_FORBIDDEN: string
    ASSIGNEE_MUST_BE_EXECUTOR: string
    OBJECT_HAS_TASKS: string
    UNKNOWN: string
    LOAD_SITES: string
    CREATE_SITE: string
    LOAD_SITE: string
    UPDATE_SITE: string
    DELETE_SITE: string
    CREATE_TASK: string
    LOAD_TASKS: string
    LOAD_TASK: string
    UPDATE_TASK: string
    DELETE_TASK: string
    TRANSITION: string
  }
}
