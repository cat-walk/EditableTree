import React, { useState, useMemo, useCallback } from 'react';
import { Tree, Input, Modal, Popconfirm, Tooltip } from 'antd';
import {
  EditOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import './EditableTree.style.less';

const { Search } = Input;

const recursiveAddNode = (treeData, newNode) => {
  const { key } = newNode;
  let hasFound = false;

  const newChildren = treeData.children.map(item => {
    if (item.key === key) {
      hasFound = true;
      return newNode;
    } else {
      return item;
    }
  });
  if (hasFound) {
    treeData.children = newChildren;
  } else {
    treeData.children.forEach(item => {
      if (item.children.length > 0) {
        recursiveAddNode(item, newNode);
      }
    });
  }
};

const recursiveDeleteNode = (treeData, nodeToDelete) => {
  const { key } = nodeToDelete;
  let hasFound = false;

  treeData.children.forEach((item, index) => {
    if (item.key === key) {
      hasFound = true;
      treeData.children.splice(index, 1);
    }
  });
  if (hasFound) {
    // treeData.children = newChildren;
  } else {
    treeData.children.forEach(item => {
      if (item.children.length > 0) {
        recursiveDeleteNode(item, nodeToDelete);
      }
    });
  }
};

const recursiveEditNode = (treeData, newNodeData) => {
  const { key } = newNodeData;
  let hasFound = false;

  // todo: 处理根节点的情况
  // if (treeData.key === key) {
  //   hasFound = true;
  // }
  treeData.children.forEach((item, index) => {
    if (item.key === key) {
      hasFound = true;
      treeData.children[index] = newNodeData;
    }
  });
  if (hasFound) {
    // treeData.children = newChildren;
  } else {
    treeData.children.forEach(item => {
      if (item.children.length > 0) {
        recursiveEditNode(item, newNodeData);
      }
    });
  }
};

const EditableNode = props => {
  const {
    treeData,
    setTreeData,
    dataNode,
    expandedKeys,
    setExpandedKeys,
  } = props;

  const [inputValue, setInputValue] = useState(dataNode.title);
  const [isCreateNode, setIsCreateNode] = useState(props.isCreateNode);
  const [isEditing, setIsEditing] = useState(isCreateNode || false);

  // let inputRef = React.createRef();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = e => {
    setInputValue(e.target.value);
  };

  const handleDelete = () => {
    recursiveDeleteNode(treeData, dataNode);
    setTreeData({ ...treeData });
  };

  const handleAdd = () => {
    dataNode.children.push({
      key: '' + Math.random(),
      title: '',
      children: [],
      isEditing: true,
      isCreateNode: true,
    });

    recursiveAddNode(treeData, dataNode);
    setTreeData({ ...treeData });
    expandedKeys.push(dataNode.key);
    setExpandedKeys([...expandedKeys]);
  };

  const stopEditing = () => {
    console.log('====================================');
    console.log(isCreateNode, dataNode);
    console.log('====================================');
    if (isCreateNode) {
      if (inputValue === '') {
        handleDelete();
        return;
      } else {
        // isCreateNode = false;
        setIsCreateNode(false);
      }
    }
    setIsEditing(false);
    recursiveEditNode(treeData, {
      ...dataNode,
      title: inputValue,
      isCreateNode: false,
    });
    setTreeData({ ...treeData });
  };

  const handleKeyDown = e => {
    if (e.keyCode === 13) {
      stopEditing();
    }
  };

  return (
    <div className="tree-node clear">
      {isEditing ? (
        <input
          className="edit-input"
          value={inputValue}
          onChange={handleChange}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          autoFocus
        ></input>
      ) : (
        <>
          <Tooltip placement="topLeft" title={inputValue}>
            <span className="title ellipsis-one-line">{inputValue}</span>
          </Tooltip>
          <span className="edit-btn-container">
            <EditOutlined className="tree-icon" onClick={handleEdit} />
            <PlusCircleOutlined className="tree-icon" onClick={handleAdd} />
            {dataNode.key === '0-0' ? null : (
              <Popconfirm
                title="你确定要删除吗？"
                okText="删除"
                cancelText="取消"
                onConfirm={handleDelete}
              >
                <MinusCircleOutlined className="tree-icon" />
              </Popconfirm>
            )}
          </span>
        </>
      )}
    </div>
  );
};

const initialData = [
  {
    key: '0-0',
    title: '北京六视花园小区',
    children: [
      {
        key: '0-0-0',
        title: '一单元',
        children: [{ key: '0-1-1', title: '101室', children: [] }],
      },
      {
        key: '0-0-1',
        title: '二单元',
        children: [],
      },
    ],
  },
];

let allKey = [];
const recursiveGetTreeAllKey = (node, notIncludeSelf) => {
  if (!notIncludeSelf) {
    allKey.push(node.key);
  }
  if (node.children && node.children.length > 0) {
    node.children.forEach(item => {
      allKey.push(item.key);
      recursiveGetTreeAllKey(item, true);
    });
  }

  return allKey;
};

const SearchTree = props => {
  const [treeData, setTreeData] = useState(initialData);
  recursiveGetTreeAllKey(treeData);
  const [expandedKeys, setExpandedKeys] = useState(allKey);

  // 为了不改变原数据——treeData而映射一个computed属性
  const iteraGetTreeHtml = useCallback(dataNode => {
    const htmlNode = {
      key: dataNode.key,
      title: (
        <EditableNode
          dataNode={dataNode}
          treeData={treeData}
          setTreeData={setTreeData}
          expandedKeys={expandedKeys}
          setExpandedKeys={setExpandedKeys}
          isCreateNode={dataNode.isCreateNode}
        ></EditableNode>
      ),
    };

    if (!dataNode) return null;
    // 首节点不需要icon时：
    // if (dataNode.key === '0-0') {
    //   htmlNode.title = dataNode.title;
    // }
    if (Array.isArray(dataNode)) {
      return dataNode.map(item => iteraGetTreeHtml(item));
    }

    if (dataNode.children) {
      htmlNode.children = iteraGetTreeHtml(dataNode.children);
    }
    return htmlNode;
  });

  const handleExpand = (expandedKeys, { expanded, node }) => {
    console.log(expandedKeys, treeData, 'treeData');
    // if (expanded) {
    //   expandedKeys.push(node.props.eventKey);
    // } else {
    //   expandedKeys.splice(expandedKeys.indexOf(node.props.eventKey), 1);
    // debugger
    setExpandedKeys([...expandedKeys]);
    console.log(expandedKeys, treeData, 'treeData');

    // }
  };

  const treeHtml = useMemo(() => {
    return iteraGetTreeHtml(treeData);
  }, [iteraGetTreeHtml, treeData]);
  const handleSearch = () => {};

  return (
    <div>
      <p className="list-title">房屋列表</p>
      <div className={props.className + ' search-tree'}>
        <Search
          style={{ marginBottom: 8 }}
          placeholder="请输入楼栋/门牌号"
          onChange={handleSearch}
        />
        <div className="tree-wrapper">
          <Tree
            showIcon
            defaultExpandAll
            draggable
            expandedKeys={expandedKeys}
            treeData={treeHtml}
            onExpand={handleExpand}
          />
        </div>
      </div>
    </div>
  );
};
export default SearchTree;
