import { Suspense } from 'react';
import Loader from './ui/Loader';

// eslint-disable-next-line react/display-name
interface LoadableProps {
  [key: string]: any;
}

type LoadableComponent = React.ComponentType<any>;

const Loadable = (Component: LoadableComponent) => (props: LoadableProps) => (
  <Suspense fallback={<Loader />}>
    <Component {...props} />
  </Suspense>
);

export default Loadable;