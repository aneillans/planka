/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { ListTypes } from '../../../constants/Enums';

import styles from './KanbanBoard.module.scss';
import globalStyles from '../../../styles.module.scss';

const KanbanBoard = React.memo(({ included }) => {
  const activeLists = useMemo(
    () => included.lists.filter((list) => list.type === ListTypes.ACTIVE),
    [included.lists],
  );

  const cardsByListId = useMemo(() => {
    const result = {};

    included.cards.forEach((card) => {
      result[card.listId] = result[card.listId] || [];
      result[card.listId].push(card);
    });

    return result;
  }, [included.cards]);

  const labelsByCardId = useMemo(() => {
    const labelById = {};
    included.labels.forEach((label) => {
      labelById[label.id] = label;
    });

    const result = {};
    included.cardLabels.forEach((cardLabel) => {
      const label = labelById[cardLabel.labelId];
      if (!label) {
        return;
      }

      result[cardLabel.cardId] = result[cardLabel.cardId] || [];
      result[cardLabel.cardId].push(label);
    });

    return result;
  }, [included.labels, included.cardLabels]);

  return (
    <div className={styles.kanbanBoard}>
      {activeLists.map((list) => {
        const cards = cardsByListId[list.id] || [];

        return (
          <div key={list.id} className={styles.list}>
            <div className={styles.listHeader}>
              <h3 className={styles.listName}>{list.name}</h3>
              <span className={styles.cardCount}>{cards.length}</span>
            </div>
            <div className={styles.cards}>
              {cards.map((card) => {
                const labels = labelsByCardId[card.id] || [];

                return (
                  <div key={card.id} className={styles.card}>
                    <div className={styles.cardName}>{card.name}</div>
                    {card.description && (
                      <div className={styles.cardDescription}>{card.description}</div>
                    )}
                    {labels.length > 0 && (
                      <div className={styles.cardLabels}>
                        {labels.map((label) => (
                          <span
                            key={label.id}
                            title={label.name}
                            className={classNames(
                              styles.label,
                              globalStyles[`background${upperFirst(camelCase(label.color))}`],
                            )}
                          >
                            {label.name || ' '}
                          </span>
                        ))}
                      </div>
                    )}
                    {card.commentsTotal > 0 && (
                      <div className={styles.cardFooter}>
                        <span className={styles.comments}>💬 {card.commentsTotal}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});

KanbanBoard.propTypes = {
  included: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default KanbanBoard;
