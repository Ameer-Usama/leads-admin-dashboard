import { useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

/**
 * Component to seed test leads for the testing package user
 * 
 * Usage: Add this component to your admin dashboard wherever you want
 * the seed button to appear.
 * 
 * Example:
 * import SeedTestLeadsButton from './components/SeedTestLeadsButton'
 * 
 * function AdminPage() {
 *   return (
 *     <div>
 *       <h1>Admin Dashboard</h1>
 *       <SeedTestLeadsButton />
 *     </div>
 *   )
 * }
 */
export default function SeedTestLeadsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const seedTestLeads = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed-test-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.ok) {
        setResult(data)
        setDialogOpen(true)
      } else {
        setError(data.error || 'Failed to seed test leads')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={seedTestLeads}
        disabled={loading}
        variant="outline"
        className="gap-2"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            Seeding...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Seed Test Leads
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>✅ Test Leads Created Successfully!</DialogTitle>
            <DialogDescription>
              {result && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="font-semibold text-green-900">
                      Test User Created/Updated
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-green-800">
                      <p>
                        <strong>Email:</strong> {result.user?.email}
                      </p>
                      <p>
                        <strong>Name:</strong> {result.user?.name}
                      </p>
                      <p>
                        <strong>User ID:</strong> {result.user?.id}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="font-semibold text-blue-900">
                      Leads Created
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-blue-800">
                      <div>
                        📸 Instagram:{' '}
                        <strong>{result.leadsCreated?.instagram}</strong>
                      </div>
                      <div>
                        🐦 Twitter:{' '}
                        <strong>{result.leadsCreated?.twitter}</strong>
                      </div>
                      <div>
                        📘 Facebook:{' '}
                        <strong>{result.leadsCreated?.facebook}</strong>
                      </div>
                      <div>
                        🏢 GMB: <strong>{result.leadsCreated?.gmb}</strong>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-blue-200 pt-3 text-sm font-bold text-blue-900">
                      Total: {result.leadsCreated?.total} leads
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">
                      API Endpoint to verify:
                    </p>
                    <code className="mt-1 block rounded bg-gray-100 p-2">
                      GET /api/leads/{result.user?.id}
                    </code>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

