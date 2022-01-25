import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from 'styled-components';
import { HighlightCard } from '../../components/HighlightCard';
import {
  TransactionCard,
  TransactionCardData,
} from '../../components/TransactionCard';
import { useAuth } from '../../hooks/auth';
import {
  Container,
  Header,
  HighlightCards,
  Icon,
  LoadContainer,
  LogoutButton,
  Photo,
  Title,
  TransactionList,
  Transactions,
  User,
  UserGreeting,
  UserInfo,
  UserName,
  UserWrapper,
} from './styles';

export interface TransactionListProps extends TransactionCardData {
  id: string;
}

interface HighlightProps {
  amount: string;
  lastTransactionDate: string;
}

interface HighlightData {
  entries: HighlightProps;
  expenses: HighlightProps;
  total: HighlightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>(
    {} as HighlightData
  );

  const theme = useTheme();
  const { signOut, user } = useAuth();

  function getLastTransactionDate(
    collection: TransactionListProps[],
    type: 'positive' | 'negative'
  ) {
    const collectionFiltered = collection.filter(
      (transaction) => transaction.type === type
    );

    // console.log(type, collectionFiltered);

    // verificando se a data é Null
    if (collectionFiltered.length === 0) {
      return '0';
    }

    // pegando a "maior data", ou seja, a data mais recente, entre as transações de entrada
    const lastTransaction = new Date(
      Math.max.apply(
        Math,
        collectionFiltered.map((transaction) =>
          new Date(transaction.date).getTime()
        )
      )
    );

    // retornando a data mais recente (de cada type) formatada
    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString(
      'pt-BR',
      { month: 'long' }
    )}`;
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;

    const response = await AsyncStorage.getItem(dataKey);

    // console.log(response);

    const transactions = response ? JSON.parse(response) : [];

    console.log(transactions);

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: TransactionListProps[] = transactions.map(
      (item: TransactionListProps) => {
        if (item.type === 'positive') {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amountFormatted = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        const dateFormatted = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount: amountFormatted,
          type: item.type,
          category: item.category,
          date: dateFormatted,
        };
      }
    );

    setTransactions(transactionsFormatted);

    const total = entriesTotal - expensiveTotal;

    const lastTransactionsEntries = getLastTransactionDate(
      transactions,
      'positive'
    );

    const lastTransactionsExpenses = getLastTransactionDate(
      transactions,
      'negative'
    );

    const totalInterval =
      Number(lastTransactionsExpenses) === 0
        ? `01 à ${lastTransactionsEntries}`
        : `01 à ${lastTransactionsExpenses}`;

    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransactionDate:
          Number(lastTransactionsEntries) === 0
            ? 'Não há transações'
            : `Última entrada dia ${lastTransactionsEntries}`,
      },
      expenses: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransactionDate:
          Number(lastTransactionsExpenses) === 0
            ? 'Não há transações'
            : `Última saída dia ${lastTransactionsExpenses}`,
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        lastTransactionDate: totalInterval,
      },
    });

    setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  return (
    <Container>
      {isLoading ? (
        <LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size='large' />
        </LoadContainer>
      ) : (
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{ uri: user.photo }} />
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={signOut}>
                <Icon name='power' />
              </LogoutButton>
            </UserWrapper>
          </Header>
          <HighlightCards>
            <HighlightCard
              type='up'
              title='Entradas'
              amount={highlightData.entries.amount}
              lastTransaction={highlightData.entries.lastTransactionDate}
            />
            <HighlightCard
              type='down'
              title='Saídas'
              amount={highlightData.expenses.amount}
              lastTransaction={highlightData.expenses.lastTransactionDate}
            />
            <HighlightCard
              type='total'
              title='Total'
              amount={highlightData.total.amount}
              lastTransaction={highlightData.total.lastTransactionDate}
            />
          </HighlightCards>
          <Transactions>
            <Title>Listagem</Title>
            <TransactionList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </Transactions>
        </>
      )}
    </Container>
  );
}
