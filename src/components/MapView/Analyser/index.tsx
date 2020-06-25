import React, { useMemo } from 'react';
import {
  Button,
  createStyles,
  Theme,
  Typography,
  withStyles,
  WithStyles,
  Radio,
} from '@material-ui/core';
import { Assessment, ArrowDropDown } from '@material-ui/icons';
import { extent as calculateExtentFromGeoJSON } from 'geojson-bounds';
import { useSelector } from 'react-redux';
import {
  getBoundaryLayerSingleton,
  LayerDefinitions,
} from '../../../config/utils';
import {
  BoundaryLayerProps,
  NSOLayerProps,
  WMSLayerProps,
} from '../../../config/types';
import { ApiData, fetchApiData } from '../../../utils/flask-api-utils';
import { getWCSLayerUrl } from '../../../context/layers/wms';
import { LayerData } from '../../../context/layers/layer-data';
import { layerDataSelector } from '../../../context/mapStateSlice';
import { Extent } from '../Layers/raster-utils';

const layers = Object.values(LayerDefinitions);
const baselineLayers = layers.filter(
  (layer): layer is NSOLayerProps => layer.type === 'nso',
);
const hazardLayers = layers.filter(
  (layer): layer is WMSLayerProps => layer.type === 'wms',
);
const boundaryLayer = getBoundaryLayerSingleton();

function Analyser({ classes }: AnalyserProps) {
  const [open, setOpen] = React.useState(false);

  const boundaryLayerData = useSelector(layerDataSelector(boundaryLayer.id)) as
    | LayerData<BoundaryLayerProps>
    | undefined;

  const adminBoundariesExtent = useMemo(() => {
    if (!boundaryLayerData)
      // not loaded yet. Should be loaded in MapView
      return null;
    return calculateExtentFromGeoJSON(boundaryLayerData.data); // we get extents of admin boundaries to give to the api.
  }, [boundaryLayerData]);
  console.log(adminBoundariesExtent);

  return (
    <div className={classes.container}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(!open)}
      >
        <Assessment style={{ marginRight: '10px' }} />
        <Typography variant="body2">Run Analysis</Typography>
        <ArrowDropDown />
      </Button>

      <Button
        variant="contained"
        color="primary"
        className={classes.analyserButton}
      >
        <Typography variant="body2">Show Result</Typography>
      </Button>
      <Button
        variant="contained"
        color="primary"
        className={classes.analyserButton}
      >
        <Typography variant="body2">Download</Typography>
      </Button>

      <div
        className={classes.analyserMenu}
        style={{ width: open ? 500 : 0, padding: open ? 50 : 0 }}
      >
        {baselineLayers.reduce((str, layer) => `${str + layer.title}\n`, '')}
        {hazardLayers.reduce((str, layer) => `${str + layer.title}\n`, '')}
      </div>
    </div>
  );
}

const apiUrl = 'https://prism-api.ovio.org/stats'; // TODO needs to be stored somewhere
async function submitAnaysisRequest(
  baselineLayer: NSOLayerProps,
  hazardLayer: WMSLayerProps,
  extent: Extent,
  date: number,
  statistic: 'mean' | 'median', // we cant use AggregateOptions here but we should aim to in the future.
): Promise<Array<object>> {
  const apiRequest: ApiData = {
    geotiff_url: getWCSLayerUrl({
      layer: hazardLayer,
      date,
      extent,
    }),
    zones_url: getBoundaryLayerSingleton().path,
    group_by: baselineLayer.adminCode, // TODO needs to be a level in admin_boundaries, admin_level
  };
  const data = await fetchApiData(apiUrl, apiRequest);

  return [];
}

const styles = (theme: Theme) =>
  createStyles({
    container: {
      zIndex: theme.zIndex.drawer,
      position: 'absolute',
      top: 2,
      left: 2,
      textAlign: 'left',
    },
    analyserMenu: {
      backgroundColor: '#5A686C',
      maxWidth: '100vw',
      color: 'white',
      overflowX: 'hidden',
      transition: 'all 0.5s ease-in-out',
      whiteSpace: 'nowrap',
      borderTopRightRadius: '10px',
      borderBottomRightRadius: '10px',
      height: '600px',
      maxHeight: '90vh',
    },
    analyserButton: {
      height: '36px',
      'margin-left': '3px',
    },
  });

interface AnalyserProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(Analyser);
