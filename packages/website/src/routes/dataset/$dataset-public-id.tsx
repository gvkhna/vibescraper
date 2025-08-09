// import {DatasetPage} from '@partials/datasets/_dataset-page'
import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/dataset/$dataset-public-id')({
  component: RouteComponent
})

function RouteComponent() {
  return <></>
  // return <DatasetPage />
}
