import m, { FactoryComponent } from 'mithril';
import { FlatButton, NumberInput } from 'mithril-materialized'; // Adjust import as needed

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => Promise<void>;
  onFastForward?: () => Promise<void>; // Optional fast forward handler
}

export const Pagination: FactoryComponent<PaginationProps> = () => {
  let showInput = false;

  return {
    view: ({ attrs: { currentPage, totalPages, onPageChange, onFastForward } }) => {
      const isFirstPage = currentPage === 1;
      const isLastPage = currentPage === totalPages;

      const handlePageInput = async (newPage: number) => {
        if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
          await onPageChange(newPage);
          showInput = false;
        }
      };

      return m(
        'div',
        {
          style: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 -2px 5px rgba(0,0,0,0.1)',
            zIndex: 1000,
          },
        },
        [
          m(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              },
            },
            [
              // Fast back button
              m(FlatButton, {
                iconName: 'first_page',
                disabled: isFirstPage,
                onclick: async () => {
                  if (!isFirstPage) {
                    await onPageChange(1);
                  }
                },
              }),

              // Previous button
              m(FlatButton, {
                iconName: 'navigate_before',
                label: 'Previous',
                disabled: isFirstPage,
                onclick: async () => {
                  if (!isFirstPage) {
                    await onPageChange(currentPage - 1);
                  }
                },
              }),

              // Page number display/input
              showInput
                ? m(NumberInput, {
                    className: 'no-margins',
                    label: 'New index',
                    initialValue: currentPage,
                    onchange: async (v) => {
                      showInput = false;
                      await handlePageInput(v);
                    },
                  })
                : m(
                    'span',
                    {
                      onclick: () => {
                        showInput = true;
                      },
                      style: {
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        margin: '0 10px',
                        padding: '5px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                      },
                    },
                    `Page ${currentPage} of ${totalPages}`
                  ),

              // Next button
              m(FlatButton, {
                iconName: 'navigate_next',
                label: 'Next',
                disabled: isLastPage,
                onclick: async () => {
                  if (!isLastPage) {
                    await onPageChange(currentPage + 1);
                  }
                },
              }),

              // Fast forward button
              m(FlatButton, {
                iconName: 'last_page',
                disabled: !onFastForward,
                onclick: async () => {
                  if (onFastForward) {
                    await onFastForward();
                  }
                },
              }),
            ]
          ),
        ]
      );
    },
  };
};
