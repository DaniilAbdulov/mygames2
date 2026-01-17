import React, {useEffect} from 'react';
import {observer} from 'mobx-react-lite';
import {useStores} from '../../stores/useStores';
import {Loader} from '../ui/Loader';
import {GameItem} from './GameItem';

export const GamesList: React.FC = observer(() => {
  const {gamesStore} = useStores();
  const {games, isLoading, loadGames} = gamesStore;

  useEffect(() => {
    loadGames();
  }, []);

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (games.length === 0) {
    return <div>{'Список игр пуст'}</div>;
  }

  return games.map((game) => <GameItem key={game.id} game={game} />);
});
