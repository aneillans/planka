/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Loader, Message } from 'semantic-ui-react';

import Config from '../../../constants/Config';
import KanbanBoard from './KanbanBoard';

import styles from './PublicBoard.module.scss';

const PublicBoard = React.memo(() => {
  const { publicId } = useParams();

  const [t] = useTranslation();

  const [data, setData] = useState(null);
  const [isError, setIsError] = useState(false);

  const fetchBoard = useCallback(async () => {
    const response = await fetch(
      `${Config.SERVER_BASE_URL}/api/public-boards/${encodeURIComponent(publicId)}`,
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  }, [publicId]);

  useEffect(() => {
    let isCurrent = true;

    setData(null);
    setIsError(false);

    fetchBoard()
      .then((nextData) => {
        if (isCurrent) {
          setData(nextData);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setIsError(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [fetchBoard]);

  useEffect(() => {
    if (data) {
      document.title = data.item.name;
    }
  }, [data]);

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <Message error>
          <Message.Header>{t('common.boardNotAvailable', 'Board not available')}</Message.Header>
          <p>
            {t(
              'common.thisBoardIsEitherPrivateOrDoesNotExist',
              'This board is either private or does not exist.',
            )}
          </p>
        </Message>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.wrapper}>
        <Loader active size="massive" />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.boardName}>{data.item.name}</h1>
        <div className={styles.badge}>
          {t('common.readOnlyPublicView', 'Read only - public view')}
        </div>
      </div>
      <div className={styles.content}>
        <KanbanBoard included={data.included} />
      </div>
    </div>
  );
});

export default PublicBoard;
