export function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/)
  const initials = words
    .slice(0, 2)
    .map((word) => {
      if (word[0]) {
        return word[0].toUpperCase()
      }
      return null
    })
    .join('')
  return initials
}

// Generate a consistent color based on the username
export function getAvatarColor(name: string) {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}
