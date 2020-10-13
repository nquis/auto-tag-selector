import React, { useCallback, useReducer, useRef } from 'react'
import _ from 'lodash'
import { Button, Grid, Icon, Label, Search } from 'semantic-ui-react'

const initialState: any = {
    loading: false,
    results: [],
    selectedItemList: [],
    value: '',
}

interface IAction {
    type?: string
    selection?: any
    query?: string
    results?: any[]
    selectedItemList?: any[]
}

function exampleReducer(state: any, action: IAction) {
    switch (action.type) {
        case 'CLEAN_QUERY':
            return initialState
        case 'START_SEARCH':
            return { ...state, loading: true, value: action.query }
        case 'FINISH_SEARCH':
            return { ...state, loading: false, results: action.results }
        case 'UPDATE_SELECTIONLIST':
            return {
                ...state,
                loading: false,
                selectedItemList: action.selectedItemList,
            }
        case 'UPDATE_SELECTION':
            return { ...state, value: '' }
        case 'DELETE_SELECTION':
            return { ...state }
        default:
            throw new Error()
    }
}

const resultRenderer: any = (props: any) => <Label content={props.title} />

interface IAutoSelector {
    source: any[] | null
    selectedItems?: any[] | null
    searchField: string
    idField: string
    onSelected: (selectedItem: any) => Promise<boolean | undefined>
    onDeleted: (deletedItem: any) => Promise<boolean | undefined>
}

export const AutoSelector: React.FC<IAutoSelector> = ({
    source,
    selectedItems,
    searchField,
    idField,
    onSelected,
    onDeleted,
}) => {
    const [state, dispatch] = useReducer(exampleReducer, initialState)
    const { loading, results, selectedItemList, value } = state

    const addNewSelectedItem = (item: any) => {
        selectedItemList.push(item)
        dispatch({ type: 'UPDATE_SELECTIONLIST', selectedItemList })
    }

    if (source) {
        source = source.map((item: any) => {
            return { id: item[idField], title: item[searchField] }
        })
    }

    const deleteHandler = async (deletedItem: any) => {
        const deletedObject = selectedItemList.filter(
            (item: any) => item.id === deletedItem
        )[0]
        onDeleted(deletedObject).then((result) => {
            if (result === true) {
                const newList = selectedItemList.filter(
                    (item: any) => item.id !== deletedItem
                )
                dispatch({
                    type: 'UPDATE_SELECTIONLIST',
                    selectedItemList: newList,
                })
            }
        })
    }

    const timeoutRef: any = useRef()
    const handleSearchChange = useCallback(
        (e, data) => {
            clearTimeout(timeoutRef.current)
            dispatch({ type: 'START_SEARCH', query: data.value })

            timeoutRef.current = setTimeout(() => {
                if (data.value.length === 0) {
                    dispatch({ type: 'CLEAN_QUERY' })
                    return
                }

                const re = new RegExp(_.escapeRegExp(data.value), 'i')
                const isMatch = (result: any) => re.test(result.title)
                dispatch({
                    type: 'FINISH_SEARCH',
                    results: _.filter(source, isMatch),
                })
            }, 300)
        },
        [source]
    )
    React.useEffect(() => {
        if (selectedItems) {
            const intSelectedItemList: any[] = selectedItems.map((item) => {
                return { id: item[idField], title: item[searchField] }
            })

            dispatch({
                type: 'UPDATE_SELECTIONLIST',
                selectedItemList: intSelectedItemList,
            })
        }
        return () => {
            clearTimeout(timeoutRef.current)
        }
    }, [idField, searchField, selectedItems])

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column width="16">
                    <Search
                        loading={loading}
                        onResultSelect={(e, data) => {
                            onSelected(data.result).then((result) => {
                                if (result === true) {
                                    addNewSelectedItem(data.result)
                                }
                            })
                            dispatch({
                                type: 'UPDATE_SELECTION',
                                selection: data.result,
                            })
                        }}
                        onSearchChange={handleSearchChange}
                        resultRenderer={resultRenderer}
                        results={results}
                        value={value}
                    />
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                {selectedItemList.length > 0 && (
                    <Grid.Column width="16">
                        {selectedItemList.map((item: any, index: number) => (
                            <SelectedListItem
                                id={item.id}
                                title={item.title}
                                deleteHandler={deleteHandler}
                                key={index}
                            />
                        ))}
                    </Grid.Column>
                )}
            </Grid.Row>
        </Grid>
    )
}

interface ISelectedListItem {
    id: string
    title: string
    deleteHandler: (id: string) => void
}
const SelectedListItem: React.FC<ISelectedListItem> = ({
    id,
    title,
    deleteHandler,
}) => {
    return (
        <Button as="div" labelPosition="left">
            <Label as="a" basic pointing="right">
                {title}
            </Label>
            <Button icon onClick={() => deleteHandler(id)}>
                <Icon name="close" />
            </Button>
        </Button>
    )
}
