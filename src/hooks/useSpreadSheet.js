import { useReducer } from 'react'
import { getColumn } from '../utils/index.js'

const getInitialState = ({ columns, rows }) => {
  const cells = Array.from(
    { length: columns },
    () => Array.from(
      { length: rows },
      () => ({ computedValue: 0, value: 0 })
    )
  )

  return { cells }
}

const generateCode = (value, constants) => {
  return `(() => {
    ${constants}
    return ${value};
  })()`
}

const generateCellsConstants = cells => {
  return cells.map((rows, x) => {
    return rows.map((cell, y) => {
      const letter = getColumn(x)
      const cellId = `${letter}${y}`
      return `const ${cellId} = ${cell.computedValue};`
    }).join('\n')
  }).join('\n')
}

const computeValue = (value, constants) => {
  if (!value.startsWith?.('=')) return value

  const valueToUse = value.substring(1)

  let computedValue
  try {
    computedValue = eval(generateCode(valueToUse, constants))
  } catch (e) {
    computedValue = `!ERROR ${e.message}`
  }

  return computedValue
}

const computeAllCells = (cells, constants) => {
  cells.forEach((row, x) => {
    row.forEach((cell, y) => {
      const computedValue = computeValue(cell.value, constants)
      cell.computedValue = computedValue
    })
  })
}

const reducer = (state, action) => {
  const { type, payload } = action

  if (type === 'updateCell') {
    const cells = structuredClone(state.cells)
    const { x, y, value } = payload

    const constants = generateCellsConstants(cells)

    const cell = cells[x][y]

    const computedValue = computeValue(value, constants)

    cell.value = value
    cell.computedValue = computedValue

    computeAllCells(cells, generateCellsConstants(cells))

    return { cells }
  }

  return state
}

export const useSpreadSheet = ({ columns, rows }) => {
  const [{ cells }, dispatch] = useReducer(
    reducer,
    getInitialState({ columns, rows })
  )

  const updateCell = ({ x, y, value }) => {
    dispatch({ type: 'updateCell', payload: { x, y, value } })
  }

  return { cells, updateCell }
}
