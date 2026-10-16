export function customerActions(role: 'Admin' | 'Staff') {
  return { canManage: role === 'Admin', canRead: true }
}

export function customerUpdatePayload(form: { name: string; contactName: string; phone: string; email: string; address: string }, rowVersion: string) {
  return { ...form, rowVersion }
}
