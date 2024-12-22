import m, { FactoryComponent } from 'mithril';
import { FlatButton, NumberInput } from 'mithril-materialized'; // Adjust import as needed

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalAnnotations: number;
  onPageChange: (newPage: number) => Promise<void>;
  onFindAnnotation?: (next?: boolean) => Promise<void>; // Optional fast forward handler
}

export const Pagination: FactoryComponent<PaginationProps> = () => {
  let showInput = false;

  return {
    view: ({ attrs: { currentPage, totalPages, totalAnnotations, onPageChange, onFindAnnotation } }) => {
      console.log(`Current page: ${currentPage}`);
      const isFirstPage = currentPage === 0;
      const isLastPage = currentPage === totalPages - 1;

      const handlePageInput = async (newPage: number) => {
        if (!isNaN(newPage) && newPage >= 0 && newPage <= totalPages) {
          await onPageChange(newPage - 1);
          showInput = false;
        }
      };

      return (
        totalPages > 0 &&
        m(
          '.pagination',
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
                  iconName: 'keyboard_double_arrow_left',
                  disabled: totalAnnotations === 0 || !onFindAnnotation,
                  onclick: async () => {
                    if (onFindAnnotation) {
                      await onFindAnnotation(false);
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
                      min: 1,
                      max: totalPages,
                      className: 'no-margins',
                      label: 'New index',
                      initialValue: currentPage + 1,
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
                      `Page ${currentPage + 1} of ${totalPages}`
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
                  iconName: 'keyboard_double_arrow_right',
                  disabled: totalAnnotations === 0 || !onFindAnnotation,
                  onclick: async () => {
                    if (onFindAnnotation) {
                      await onFindAnnotation();
                    }
                  },
                }),
              ]
            ),
          ]
        )
      );
    },
  };
};
