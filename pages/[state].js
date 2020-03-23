import Header from '../components/header'
import Stat from '../components/stat'
import StateChart from '../components/state-chart'
import {
  BaseStyles,
  Container,
  Flex,
  Button,
  Text,
  Grid,
  Card,
  Heading,
  useColorMode
} from 'theme-ui'
import { alpha } from '@theme-ui/color'
import { Twitter, Globe } from 'react-feather'
import { getJSON } from '../lib/util'
import loadJSON from 'load-json-file'
import Error from 'next/error'
import MD from 'react-markdown'
import { filter, find, orderBy } from 'lodash'

export default ({ errorCode, state, daily = [], latest = {}, info = {} }) => {
  // if (errorCode) return <Error statusCode={errorCode} title="State not found" />
  const [colorMode] = useColorMode()
  const accessory = {
    bg: colorMode === 'dark' ? null : 'rgba(255, 255, 255, 0.75)',
    mx: [2, 3],
    textShadow: 'none'
  }
  return (
    <>
      <Header
        title={state.state}
        bgImg={state.landscape_background_url.replace('1280x720', '1920x1080')}
        sx={{ textAlign: 'center', mb: [4, 5] }}
      >
        <Flex sx={{ mt: [3, 4], justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            as="a"
            href={
              info.covid19Site ||
              info.covid19SiteSecondary ||
              info.covid19SiteOld
            }
            variant="outline"
            sx={{ ...accessory, color: 'blue' }}
          >
            <Globe />
            State Health Site
          </Button>
          {info.twitter && (
            <Button
              as="a"
              href={`https://twitter.com/${info.twitter}`}
              variant="outline"
              sx={{ ...accessory, color: 'twitter' }}
            >
              <Twitter />
              State COVID Twitter
            </Button>
          )}
        </Flex>
      </Header>
      <Container as="article" sx={{ maxWidth: 'copyPlus', pb: [4, 5, 6] }}>
        <Grid
          columns={[null, null, '3fr 1fr 2fr']}
          gap={[3, 4]}
          sx={{ mb: [4, 5], alignItems: 'end' }}
        >
          <div>
            <Heading variant="headline" as="h2">
              Tests reported
            </Heading>
            <Grid columns={2} sx={{}}>
              <Stat value={latest.positive} label="Positive" lg />
              <Stat value={latest.negative} label="Negative" lg />
              <Stat value={latest.pending} label="Pending" lg />
              <Stat value={latest.total} label="Total" lg />
            </Grid>
          </div>
          <Grid columns={[2, 1]}>
            <Stat value={state.population} label="Population" />
            <Stat value={'#' + state.population_rank} label="Pop. rank" />
          </Grid>
          <div>
            {info.notes && (
              <Card
                as={BaseStyles}
                variant="sunken"
                sx={{
                  padding: [3, 3],
                  textAlign: 'left',
                  maxHeight: '16em',
                  overflowY: 'auto',
                  position: 'relative',
                  ':after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'block',
                    height: theme => theme.space[3],
                    backgroundImage: theme =>
                      `linear-gradient(
                        ${alpha(theme.colors.sunken, 0)},
                        ${theme.colors.sunken})`
                  },
                  p: { my: 0 }
                }}
              >
                <Heading as="h3" variant="subheadline" sx={{ mb: 2 }}>
                  Data notes
                </Heading>
                <MD source={info.notes} components={{ p: Text }} />
              </Card>
            )}
          </div>
        </Grid>
        <StateChart data={orderBy(daily, 'date')} colorMode={colorMode} />
      </Container>
    </>
  )
}

export const getServerSideProps = async req => {
  const states = await loadJSON('./public/states-full.json')
  let { state } = req.query
  state =
    find(states, ['code', state.toUpperCase()]) ||
    find(states, ['slug', state.toLowerCase()])
  if (!state) return { props: { errorCode: 404 } }

  const { code } = state
  let daily = await getJSON(`https://covidtracking.com/api/states/daily`)
  daily = filter(daily, { state: code })
  const latest = daily.length ? daily[0] : {}
  let info = await getJSON(`https://covidtracking.com/api/states/info`)
  info = filter(info, { state: code })
  return { props: { state, daily, latest, info } }
}
